import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@meme-tunes/shared";
import {
  PLAYBACK_PAUSE_SECONDS,
  UPLOAD_COLLECT_SECONDS,
  MAX_UPLOADS_PER_PLAYER,
  COMMUNITY_VOTE_OPTIONS_COUNT,
  COMMUNITY_VOTE_SECONDS,
  FIRE_VOTE_BONUS_POINTS,
  EXTRA_TIME_SECONDS,
  EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS,
  EXTRA_TIME_VOTE_WINDOW_SECONDS,
  TRIPLE_VOTE_SECONDS,
  OWN_MEME_PICK_SECONDS,
} from "@meme-tunes/shared";
import type { GameSnapshot, MemeSourceType, Submission, TripleVoteKind, TripleVoteOption } from "@meme-tunes/shared";
import type { Lobby } from "./lobbyStore.js";
import { connectedPlayers, publicPlayers } from "./lobbyStore.js";
import { getRandomGiphyMemes, getRandomLocalMemes } from "./memes.js";
import { PausableTimer } from "./pausableTimer.js";

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

const MEME_OPTIONS_COUNT = 3;

const MEME_SOURCE_VOTE_OPTIONS: TripleVoteOption[] = [
  { key: "giphy", title: "Giphy Bilder", description: "Zufällige Meme-Bilder von Giphy." },
  { key: "local", title: "Lennys Bilderpool", description: "Bilder aus Lennys eigener Sammlung." },
  { key: "uploads", title: "Eigene Dateien", description: "Jede*r lädt eigene Bilder hoch, daraus wird gewählt." },
];
const MEME_TEXT_VOTE_OPTIONS: TripleVoteOption[] = [
  { key: "yes", title: "Text erlaubt", description: "Auf jedes Meme darf oben oder unten ein eigener Text geschrieben werden." },
  { key: "no", title: "Kein Text", description: "Die Memes bleiben unverändert, ohne Text." },
];
const MEME_MODE_VOTE_OPTIONS: TripleVoteOption[] = [
  { key: "shared", title: "Gemeinsames Meme", description: "Alle Spieler bekommen pro Runde dasselbe Meme." },
  { key: "individual", title: "Eigenes Meme", description: "Jede*r wählt sein eigenes Meme — 10s, beliebig oft skippen." },
];
// Gives clients time to load/buffer the video/YouTube player before the
// playbackSeconds countdown starts, so slow connections still get to hear
// most of the song instead of it arriving right as voting closes.
const PLAYBACK_LOAD_BUFFER_SECONDS = 2;

function scheduleTimer(lobby: Lobby, ms: number, onDone: () => void): void {
  const timer = new PausableTimer(ms, () => {
    lobby.activeTimer = null;
    onDone();
  });
  if (lobby.paused) timer.pause();
  lobby.activeTimer = timer;
}

function pausableDelay(lobby: Lobby, ms: number): Promise<void> {
  return new Promise((resolve) => scheduleTimer(lobby, ms, resolve));
}

export function pauseLobby(io: GameServer, lobby: Lobby): void {
  if (lobby.paused) return;
  lobby.paused = true;
  lobby.activeTimer?.pause();
  io.to(lobby.code).emit("game-paused");
}

export function resumeLobby(io: GameServer, lobby: Lobby): void {
  if (!lobby.paused) return;
  lobby.paused = false;

  const timer = lobby.activeTimer;
  if (timer) {
    const remaining = timer.remaining;
    timer.resume();

    if (lobby.phase === "round_meme_reveal") {
      lobby.pickDeadlineTs = Date.now() + remaining;
      io.to(lobby.code).emit("deadline-updated", { pickDeadlineTs: lobby.pickDeadlineTs });
    } else if (lobby.phase === "round_submitting") {
      lobby.submitDeadlineTs = Date.now() + remaining;
      io.to(lobby.code).emit("deadline-updated", { submitDeadlineTs: lobby.submitDeadlineTs });
    } else if (lobby.phase === "community_vote") {
      lobby.voteDeadlineTs = Date.now() + remaining;
      io.to(lobby.code).emit("deadline-updated", { voteDeadlineTs: lobby.voteDeadlineTs });
    } else if (lobby.phase === "collecting_uploads") {
      lobby.uploadDeadlineTs = Date.now() + remaining;
      io.to(lobby.code).emit("deadline-updated", { uploadDeadlineTs: lobby.uploadDeadlineTs });
    }
  }

  io.to(lobby.code).emit("game-resumed");
}

export async function startGame(io: GameServer, lobby: Lobby): Promise<void> {
  lobby.currentRoundNumber = 0;
  lobby.usedMemeUrls.clear();
  lobby.paused = false;
  lobby.uploadsByPlayer = new Map();

  const sourceKey = await runTripleVote(io, lobby, "meme_source", MEME_SOURCE_VOTE_OPTIONS);
  lobby.memeSourceChoice = sourceKey as MemeSourceType;

  const textKey = await runTripleVote(io, lobby, "meme_text", MEME_TEXT_VOTE_OPTIONS);
  lobby.textOnMemeAllowed = textKey === "yes";

  const modeKey = await runTripleVote(io, lobby, "meme_mode", MEME_MODE_VOTE_OPTIONS);
  lobby.memeMode = modeKey === "individual" ? "individual" : "shared";

  if (lobby.memeSourceChoice === "uploads") {
    beginUploadCollection(io, lobby);
  } else {
    await startRound(io, lobby);
  }
}

function runTripleVote(
  io: GameServer,
  lobby: Lobby,
  kind: TripleVoteKind,
  options: TripleVoteOption[]
): Promise<string> {
  return new Promise((resolve) => {
    lobby.phase = `vote_${kind}` as Lobby["phase"];
    lobby.tripleVoteKind = kind;
    lobby.tripleVoteOptions = options;
    lobby.tripleVotes = new Map();
    lobby.tripleVoteResolve = resolve;

    const voteDeadlineTs = Date.now() + TRIPLE_VOTE_SECONDS * 1000;
    io.to(lobby.code).emit("triple-vote-started", { kind, options, voteDeadlineTs });

    scheduleTimer(lobby, TRIPLE_VOTE_SECONDS * 1000, () => finishTripleVote(io, lobby));
  });
}

function finishTripleVote(io: GameServer, lobby: Lobby): void {
  lobby.activeTimer?.cancel();
  lobby.activeTimer = null;
  if (!lobby.tripleVoteResolve || !lobby.tripleVoteKind) return;

  const options = lobby.tripleVoteOptions;
  const tally = new Map<string, number>();
  for (const key of lobby.tripleVotes.values()) tally.set(key, (tally.get(key) ?? 0) + 1);

  let winningKey = options[Math.floor(Math.random() * options.length)].key;
  let maxVotes = 0;
  const tied: string[] = [];
  for (const opt of options) {
    const v = tally.get(opt.key) ?? 0;
    if (v > maxVotes) {
      maxVotes = v;
      tied.length = 0;
      tied.push(opt.key);
    } else if (v === maxVotes && v > 0) {
      tied.push(opt.key);
    }
  }
  if (maxVotes > 0) winningKey = tied[Math.floor(Math.random() * tied.length)];

  io.to(lobby.code).emit("triple-vote-resolved", { kind: lobby.tripleVoteKind, winningKey });

  const resolve = lobby.tripleVoteResolve;
  lobby.tripleVoteKind = null;
  lobby.tripleVoteResolve = null;
  resolve(winningKey);
}

export function submitTripleVote(io: GameServer, lobby: Lobby, socketId: string, kind: TripleVoteKind, optionKey: string): void {
  if (lobby.tripleVoteKind !== kind) return;
  if (!lobby.players.get(socketId)) return;
  if (!lobby.tripleVoteOptions.some((o) => o.key === optionKey)) return;
  if (lobby.tripleVotes.has(socketId)) return;

  lobby.tripleVotes.set(socketId, optionKey);
  const allVoted = connectedPlayers(lobby).every((p) => lobby.tripleVotes.has(p.id));
  if (allVoted) finishTripleVote(io, lobby);
}

function beginUploadCollection(io: GameServer, lobby: Lobby): void {
  lobby.phase = "collecting_uploads";
  const deadlineTs = Date.now() + UPLOAD_COLLECT_SECONDS * 1000;
  lobby.uploadDeadlineTs = deadlineTs;

  io.to(lobby.code).emit("uploads-phase-started", { deadlineTs });

  scheduleTimer(lobby, UPLOAD_COLLECT_SECONDS * 1000, () => {
    startRound(io, lobby).catch((err) => console.error("Failed to start round after uploads:", err));
  });
}

export function submitMemeUpload(lobby: Lobby, socketId: string, url: string): void {
  if (lobby.phase !== "collecting_uploads") {
    console.log(`[submitMemeUpload] rejected: lobby ${lobby.code} phase is "${lobby.phase}", not "collecting_uploads"`);
    return;
  }
  if (!lobby.players.get(socketId)) return;
  const existing = lobby.uploadsByPlayer.get(socketId) ?? [];
  if (existing.length >= MAX_UPLOADS_PER_PLAYER) {
    console.log(`[submitMemeUpload] rejected: ${socketId} already at max uploads`);
    return;
  }
  lobby.uploadsByPlayer.set(socketId, [...existing, url]);
  console.log(`[submitMemeUpload] accepted "${url}" from ${socketId}, now has ${existing.length + 1} upload(s)`);
}

async function startRound(io: GameServer, lobby: Lobby): Promise<void> {
  lobby.currentRoundNumber += 1;
  lobby.currentSubmissions = [];
  lobby.fireVoteUsedBy = new Set();

  if (lobby.memeMode === "individual") {
    await beginOwnMemePick(io, lobby);
  } else if (lobby.memeSourceChoice === "uploads") {
    await beginCommunityVote(io, lobby);
  } else {
    lobby.phase = "round_meme_reveal";
    await beginMemePick(io, lobby);
  }
}

function getUploadPool(lobby: Lobby): string[] {
  return Array.from(lobby.uploadsByPlayer.values()).flat();
}

async function beginCommunityVote(io: GameServer, lobby: Lobby): Promise<void> {
  const pool = getUploadPool(lobby).filter((url) => !lobby.usedMemeUrls.has(url));
  console.log(
    `[beginCommunityVote] lobby ${lobby.code}: total uploads=${getUploadPool(lobby).length}, usable after filtering used=${pool.length}`
  );
  let options = [...pool].sort(() => Math.random() - 0.5).slice(0, COMMUNITY_VOTE_OPTIONS_COUNT);

  if (options.length === 0) {
    console.log(`[beginCommunityVote] pool empty, falling back to Giphy`);
    try {
      options = await getRandomGiphyMemes(lobby.usedMemeUrls, COMMUNITY_VOTE_OPTIONS_COUNT);
    } catch (err) {
      console.error("Fallback auf Giphy für Community-Voting fehlgeschlagen:", err);
    }
  }

  lobby.communityVoteOptions = options;
  lobby.communityVotes = new Map();
  lobby.phase = "community_vote";

  const voteDeadlineTs = Date.now() + COMMUNITY_VOTE_SECONDS * 1000;
  lobby.voteDeadlineTs = voteDeadlineTs;

  io.to(lobby.code).emit("community-vote-started", {
    roundNumber: lobby.currentRoundNumber,
    options,
    voteDeadlineTs,
  });

  scheduleTimer(lobby, COMMUNITY_VOTE_SECONDS * 1000, () => resolveCommunityVote(io, lobby));
}

export function submitCommunityVote(io: GameServer, lobby: Lobby, socketId: string, optionIndex: number): void {
  if (lobby.phase !== "community_vote") return;
  if (!lobby.players.get(socketId)) return;
  if (optionIndex < 0 || optionIndex >= lobby.communityVoteOptions.length) return;

  lobby.communityVotes.set(socketId, optionIndex);

  const allVoted = connectedPlayers(lobby).every((p) => lobby.communityVotes.has(p.id));
  if (allVoted) resolveCommunityVote(io, lobby);
}

function resolveCommunityVote(io: GameServer, lobby: Lobby): void {
  lobby.activeTimer?.cancel();
  lobby.activeTimer = null;

  const tally = new Map<number, number>();
  for (const idx of lobby.communityVotes.values()) {
    tally.set(idx, (tally.get(idx) ?? 0) + 1);
  }

  let winningIndex = Math.floor(Math.random() * lobby.communityVoteOptions.length);
  let maxVotes = 0;
  const tiedIndices: number[] = [];
  for (let i = 0; i < lobby.communityVoteOptions.length; i++) {
    const votes = tally.get(i) ?? 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      tiedIndices.length = 0;
      tiedIndices.push(i);
    } else if (votes === maxVotes && votes > 0) {
      tiedIndices.push(i);
    }
  }
  if (maxVotes > 0) {
    winningIndex = tiedIndices[Math.floor(Math.random() * tiedIndices.length)];
  }

  const memeUrl = lobby.communityVoteOptions[winningIndex];
  proceedToSubmission(io, lobby, memeUrl);
}

function getCurrentPickerId(lobby: Lobby): string | null {
  const eligible = connectedPlayers(lobby);
  if (eligible.length === 0) return null;
  const index = (lobby.currentRoundNumber - 1) % eligible.length;
  return eligible[index].id;
}

async function beginMemePick(io: GameServer, lobby: Lobby, excludeExtra: Set<string> = new Set()): Promise<void> {
  const excluded = new Set([...lobby.usedMemeUrls, ...excludeExtra]);
  let memeOptions: string[];
  if (lobby.memeSourceChoice === "local") {
    try {
      memeOptions = await getRandomLocalMemes(excluded, MEME_OPTIONS_COUNT);
    } catch (err) {
      console.error("Lokaler Meme-Ordner nicht verfügbar, Fallback auf Giphy:", err);
      memeOptions = await getRandomGiphyMemes(excluded, MEME_OPTIONS_COUNT);
    }
  } else {
    memeOptions = await getRandomGiphyMemes(excluded, MEME_OPTIONS_COUNT);
  }
  lobby.currentMemeOptions = memeOptions;

  const pickerId = getCurrentPickerId(lobby);
  lobby.currentPickerId = pickerId;
  const picker = pickerId ? lobby.players.get(pickerId) : undefined;

  const pickDeadlineTs = Date.now() + lobby.settings.memePickSeconds * 1000;

  lobby.pickDeadlineTs = pickDeadlineTs;

  io.to(lobby.code).emit("meme-pick-started", {
    roundNumber: lobby.currentRoundNumber,
    memeOptions,
    pickDeadlineTs,
    pickerId: pickerId ?? "",
    pickerName: picker?.name ?? "?",
  });

  scheduleTimer(lobby, lobby.settings.memePickSeconds * 1000, () => resolveMemePick(io, lobby, null));
}

export function submitMemePick(io: GameServer, lobby: Lobby, socketId: string, memeIndex: number): void {
  if (lobby.phase !== "round_meme_reveal") return;
  if (lobby.currentPickerId !== socketId) return;
  if (memeIndex < 0 || memeIndex >= lobby.currentMemeOptions.length) return;
  resolveMemePick(io, lobby, memeIndex);
}

export function rerollMemeOptions(io: GameServer, lobby: Lobby, socketId: string): void {
  if (lobby.phase !== "round_meme_reveal") return;
  if (lobby.currentPickerId !== socketId) return;
  lobby.activeTimer?.cancel();
  lobby.activeTimer = null;
  beginMemePick(io, lobby, new Set(lobby.currentMemeOptions)).catch((err) =>
    console.error("Failed to reroll memes:", err)
  );
}

function resolveMemePick(io: GameServer, lobby: Lobby, chosenIndex: number | null): void {
  lobby.activeTimer?.cancel();
  lobby.activeTimer = null;

  const index = chosenIndex ?? Math.floor(Math.random() * lobby.currentMemeOptions.length);
  const memeUrl = lobby.currentMemeOptions[index];
  lobby.currentPickerId = null;

  proceedToSubmission(io, lobby, memeUrl);
}

function beginSubmissionPhase(lobby: Lobby): number {
  lobby.phase = "round_submitting";
  cancelExtraTimeRequest(lobby);
  const submitDeadlineTs = Date.now() + lobby.settings.submitSeconds * 1000;
  lobby.submitDeadlineTs = submitDeadlineTs;
  return submitDeadlineTs;
}

function proceedToSubmission(io: GameServer, lobby: Lobby, memeUrl: string): void {
  lobby.usedMemeUrls.add(memeUrl);
  lobby.currentMemeUrl = memeUrl;
  lobby.playerMemeUrls = new Map(connectedPlayers(lobby).map((p) => [p.id, memeUrl]));

  const submitDeadlineTs = beginSubmissionPhase(lobby);

  io.to(lobby.code).emit("round-started", {
    roundNumber: lobby.currentRoundNumber,
    memeUrl,
    submitDeadlineTs,
  });

  scheduleTimer(lobby, lobby.settings.submitSeconds * 1000, () => closeSubmissions(io, lobby));
}

async function beginOwnMemePick(io: GameServer, lobby: Lobby): Promise<void> {
  lobby.phase = "own_meme_pick";
  lobby.ownMemePicks = new Map();
  const deadlineTs = Date.now() + OWN_MEME_PICK_SECONDS * 1000;

  io.to(lobby.code).emit("own-meme-pick-started", { deadlineTs });

  scheduleTimer(lobby, OWN_MEME_PICK_SECONDS * 1000, () => {
    resolveOwnMemePick(io, lobby).catch((err) => console.error("Failed to resolve own-meme pick:", err));
  });
}

async function requestMemeOption(lobby: Lobby): Promise<string | null> {
  const excluded = lobby.usedMemeUrls;
  try {
    if (lobby.memeSourceChoice === "local") {
      const [url] = await getRandomLocalMemes(excluded, 1);
      return url ?? null;
    }
    if (lobby.memeSourceChoice === "uploads") {
      const pool = getUploadPool(lobby).filter((u) => !excluded.has(u));
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    const [url] = await getRandomGiphyMemes(excluded, 1);
    return url ?? null;
  } catch {
    try {
      const [url] = await getRandomGiphyMemes(excluded, 1);
      return url ?? null;
    } catch {
      return null;
    }
  }
}

export async function requestMemeOptionForPlayer(lobby: Lobby, socketId: string): Promise<string | null> {
  if (lobby.phase !== "own_meme_pick") return null;
  if (!lobby.players.get(socketId)) return null;
  return requestMemeOption(lobby);
}

export function submitOwnMeme(io: GameServer, lobby: Lobby, socketId: string, url: string): void {
  if (lobby.phase !== "own_meme_pick") return;
  if (!lobby.players.get(socketId)) return;
  lobby.ownMemePicks.set(socketId, url);

  const allPicked = connectedPlayers(lobby).every((p) => lobby.ownMemePicks.has(p.id));
  if (allPicked) {
    resolveOwnMemePick(io, lobby).catch((err) => console.error("Failed to resolve own-meme pick:", err));
  }
}

async function resolveOwnMemePick(io: GameServer, lobby: Lobby): Promise<void> {
  if (lobby.phase !== "own_meme_pick") return;
  lobby.activeTimer?.cancel();
  lobby.activeTimer = null;

  for (const player of connectedPlayers(lobby)) {
    if (lobby.ownMemePicks.has(player.id)) continue;
    const fallback = await requestMemeOption(lobby);
    if (fallback) lobby.ownMemePicks.set(player.id, fallback);
  }

  const submitDeadlineTs = beginSubmissionPhase(lobby);
  lobby.currentMemeUrl = null;
  lobby.playerMemeUrls = new Map();

  for (const player of connectedPlayers(lobby)) {
    const memeUrl = lobby.ownMemePicks.get(player.id);
    if (!memeUrl) continue;
    lobby.usedMemeUrls.add(memeUrl);
    lobby.playerMemeUrls.set(player.id, memeUrl);
    io.to(player.id).emit("round-started", {
      roundNumber: lobby.currentRoundNumber,
      memeUrl,
      submitDeadlineTs,
    });
  }

  scheduleTimer(lobby, lobby.settings.submitSeconds * 1000, () => closeSubmissions(io, lobby));
}

export function tryCloseSubmissionsEarly(io: GameServer, lobby: Lobby): void {
  if (lobby.phase !== "round_submitting") return;
  const submittedPlayerIds = new Set(lobby.currentSubmissions.map((s) => s.playerId));
  const allSubmitted = connectedPlayers(lobby).every((p) => submittedPlayerIds.has(p.id));
  if (allSubmitted) closeSubmissions(io, lobby);
}

function closeSubmissions(io: GameServer, lobby: Lobby): void {
  lobby.activeTimer?.cancel();
  lobby.activeTimer = null;
  cancelExtraTimeRequest(lobby);
  lobby.phase = "round_playback";
  io.to(lobby.code).emit("submissions-closed");
  playSubmissions(io, lobby).catch((err) => console.error("Playback sequence failed:", err));
}

function cancelExtraTimeRequest(lobby: Lobby): void {
  if (!lobby.extraTimeRequest) return;
  clearTimeout(lobby.extraTimeRequest.timer);
  lobby.extraTimeRequest = null;
}

function extraTimeEligibleIds(lobby: Lobby): Set<string> {
  if (!lobby.extraTimeRequest) return new Set();
  const submittedIds = new Set(lobby.currentSubmissions.map((s) => s.playerId));
  return new Set([...submittedIds, ...lobby.extraTimeRequest.requesterIds]);
}

function extraTimeYesIds(lobby: Lobby): Set<string> {
  if (!lobby.extraTimeRequest) return new Set();
  return new Set([...lobby.extraTimeRequest.requesterIds, ...lobby.extraTimeRequest.voterIds]);
}

function broadcastExtraTimeUpdate(io: GameServer, lobby: Lobby): void {
  io.to(lobby.code).emit("extra-time-updated", {
    yesVotes: extraTimeYesIds(lobby).size,
    eligibleVoters: extraTimeEligibleIds(lobby).size,
  });
}

export function requestExtraTime(io: GameServer, lobby: Lobby, socketId: string): void {
  if (lobby.phase !== "round_submitting" || lobby.submitDeadlineTs === null) return;
  const remaining = lobby.submitDeadlineTs - Date.now();
  if (remaining > EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS * 1000) return;

  const alreadySubmitted = lobby.currentSubmissions.some((s) => s.playerId === socketId);
  if (alreadySubmitted) return;

  if (lobby.extraTimeRequest) {
    if (lobby.extraTimeRequest.requesterIds.has(socketId)) return;
    lobby.extraTimeRequest.requesterIds.add(socketId);
    broadcastExtraTimeUpdate(io, lobby);
    return;
  }

  const voteDeadlineTs = Date.now() + EXTRA_TIME_VOTE_WINDOW_SECONDS * 1000;
  const timer = setTimeout(() => resolveExtraTimeRequest(io, lobby), EXTRA_TIME_VOTE_WINDOW_SECONDS * 1000);
  lobby.extraTimeRequest = {
    requesterIds: new Set([socketId]),
    voterIds: new Set(),
    timer,
    voteDeadlineTs,
  };

  io.to(lobby.code).emit("extra-time-started", {
    voteDeadlineTs,
    yesVotes: extraTimeYesIds(lobby).size,
    eligibleVoters: extraTimeEligibleIds(lobby).size,
  });
}

export function voteExtraTime(io: GameServer, lobby: Lobby, socketId: string): void {
  if (lobby.phase !== "round_submitting" || !lobby.extraTimeRequest) return;
  const alreadySubmitted = lobby.currentSubmissions.some((s) => s.playerId === socketId);
  if (!alreadySubmitted) return;
  if (lobby.extraTimeRequest.voterIds.has(socketId)) return;

  lobby.extraTimeRequest.voterIds.add(socketId);
  broadcastExtraTimeUpdate(io, lobby);
}

function resolveExtraTimeRequest(io: GameServer, lobby: Lobby): void {
  if (!lobby.extraTimeRequest) return;

  const eligible = extraTimeEligibleIds(lobby);
  const yes = extraTimeYesIds(lobby);
  const granted = eligible.size > 0 && yes.size * 2 > eligible.size;
  lobby.extraTimeRequest = null;

  if (granted && lobby.phase === "round_submitting" && lobby.submitDeadlineTs !== null) {
    lobby.activeTimer?.extend(EXTRA_TIME_SECONDS * 1000);
    lobby.submitDeadlineTs += EXTRA_TIME_SECONDS * 1000;
    io.to(lobby.code).emit("deadline-updated", { submitDeadlineTs: lobby.submitDeadlineTs });
  }

  io.to(lobby.code).emit("extra-time-resolved", { granted });
}

function shuffled(submissions: Submission[]): Submission[] {
  const copy = [...submissions];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function playSubmissions(io: GameServer, lobby: Lobby): Promise<void> {
  for (const submission of shuffled(lobby.currentSubmissions)) {
    lobby.currentVotingSubmissionId = submission.id;

    io.to(lobby.code).emit("now-playing", {
      submissionId: submission.id,
      source: submission.source,
      videoId: submission.videoId,
      fileUrl: submission.fileUrl,
      startSeconds: submission.startSeconds,
      playerId: submission.playerId,
      playerName: submission.playerName,
      thumbnailUrl: submission.thumbnailUrl,
      serverTs: Date.now(),
    });
    await pausableDelay(lobby, PLAYBACK_LOAD_BUFFER_SECONDS * 1000);

    io.to(lobby.code).emit("voting-open", submission.id);

    await pausableDelay(lobby, lobby.settings.playbackSeconds * 1000);

    lobby.currentVotingSubmissionId = null;
    io.to(lobby.code).emit("song-results", {
      submissionId: submission.id,
      upVotes: submission.upVotes.length,
      downVotes: submission.downVotes.length,
      neutralVotes: submission.neutralVotes.length,
      fireVotes: submission.fireVotes.length,
      ...(lobby.settings.anonymousVoting
        ? {}
        : {
            upVoterNames: submission.upVotes.map((id) => lobby.players.get(id)?.name ?? "?"),
            downVoterNames: submission.downVotes.map((id) => lobby.players.get(id)?.name ?? "?"),
            neutralVoterNames: submission.neutralVotes.map((id) => lobby.players.get(id)?.name ?? "?"),
            fireVoterNames: submission.fireVotes.map((id) => lobby.players.get(id)?.name ?? "?"),
          }),
    });

    await pausableDelay(lobby, PLAYBACK_PAUSE_SECONDS * 1000);
  }

  finishRound(io, lobby);
}

const ROUND_RESULTS_DISPLAY_MS = 15000;

function finishRound(io: GameServer, lobby: Lobby): void {
  for (const submission of lobby.currentSubmissions) {
    const player = lobby.players.get(submission.playerId);
    if (player) {
      player.score +=
        submission.upVotes.length - submission.downVotes.length + submission.fireVotes.length * FIRE_VOTE_BONUS_POINTS;
    }
  }

  lobby.phase = "round_results";

  const leaderboard = publicPlayers(lobby)
    .map((p) => ({ playerId: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);

  io.to(lobby.code).emit("round-leaderboard", leaderboard);

  scheduleTimer(lobby, ROUND_RESULTS_DISPLAY_MS, () => {
    if (lobby.currentRoundNumber >= lobby.settings.totalRounds) {
      lobby.phase = "game_over";
      io.to(lobby.code).emit("game-over", leaderboard);
    } else {
      startRound(io, lobby).catch((err) => console.error("Failed to start next round:", err));
    }
  });
}

// Rebuilds everything a freshly (re)connected client needs to jump straight
// back into whatever screen the rest of the lobby is currently on, since a
// page reload wipes all client-side React state.
export function buildSnapshot(lobby: Lobby, playerId: string): GameSnapshot {
  const hasSubmitted = lobby.currentSubmissions.some((s) => s.playerId === playerId);
  const submissionsClosed = lobby.phase === "round_playback" || lobby.phase === "round_results";

  let memePickData: GameSnapshot["memePickData"] = null;
  if (lobby.phase === "round_meme_reveal" && lobby.pickDeadlineTs !== null) {
    const picker = lobby.currentPickerId ? lobby.players.get(lobby.currentPickerId) : undefined;
    memePickData = {
      roundNumber: lobby.currentRoundNumber,
      memeOptions: lobby.currentMemeOptions,
      pickDeadlineTs: lobby.pickDeadlineTs,
      pickerId: lobby.currentPickerId ?? "",
      pickerName: picker?.name ?? "?",
    };
  }

  let roundData: GameSnapshot["roundData"] = null;
  if (
    (lobby.phase === "round_submitting" || lobby.phase === "round_playback") &&
    lobby.currentMemeUrl &&
    lobby.submitDeadlineTs !== null
  ) {
    roundData = {
      roundNumber: lobby.currentRoundNumber,
      memeUrl: lobby.currentMemeUrl,
      submitDeadlineTs: lobby.submitDeadlineTs,
    };
  }

  let communityVoteData: GameSnapshot["communityVoteData"] = null;
  if (lobby.phase === "community_vote" && lobby.voteDeadlineTs !== null) {
    communityVoteData = {
      roundNumber: lobby.currentRoundNumber,
      options: lobby.communityVoteOptions,
      voteDeadlineTs: lobby.voteDeadlineTs,
    };
  }

  let nowPlaying: GameSnapshot["nowPlaying"] = null;
  const votedSubmissionIds: string[] = [];

  if (lobby.phase === "round_playback") {
    for (const s of lobby.currentSubmissions) {
      if (s.upVotes.includes(playerId) || s.downVotes.includes(playerId) || s.neutralVotes.includes(playerId)) {
        votedSubmissionIds.push(s.id);
      }
    }
    const submission = lobby.currentVotingSubmissionId
      ? lobby.currentSubmissions.find((s) => s.id === lobby.currentVotingSubmissionId)
      : undefined;
    if (submission) {
      nowPlaying = {
        submissionId: submission.id,
        source: submission.source,
        videoId: submission.videoId,
        fileUrl: submission.fileUrl,
        startSeconds: submission.startSeconds,
        playerId: submission.playerId,
        playerName: submission.playerName,
        thumbnailUrl: submission.thumbnailUrl,
      };
    }
  }

  let extraTimeState: GameSnapshot["extraTimeState"] = null;
  if (lobby.extraTimeRequest) {
    extraTimeState = {
      voteDeadlineTs: lobby.extraTimeRequest.voteDeadlineTs,
      yesVotes: extraTimeYesIds(lobby).size,
      eligibleVoters: extraTimeEligibleIds(lobby).size,
    };
  }

  let roundLeaderboard: GameSnapshot["roundLeaderboard"] = null;
  let finalLeaderboard: GameSnapshot["finalLeaderboard"] = null;
  if (lobby.phase === "round_results" || lobby.phase === "game_over") {
    const board = publicPlayers(lobby)
      .map((p) => ({ playerId: p.id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);
    if (lobby.phase === "game_over") finalLeaderboard = board;
    else roundLeaderboard = board;
  }

  return {
    phase: lobby.phase,
    players: publicPlayers(lobby),
    settings: lobby.settings,
    paused: lobby.paused,
    currentRoundNumber: lobby.currentRoundNumber,
    memePickData,
    roundData,
    hasSubmitted,
    submissionsClosed,
    communityVoteData,
    uploadDeadlineTs: lobby.phase === "collecting_uploads" ? lobby.uploadDeadlineTs : null,
    nowPlaying,
    votedSubmissionIds,
    fireVoteUsed: lobby.fireVoteUsedBy.has(playerId),
    extraTimeState,
    roundLeaderboard,
    finalLeaderboard,
  };
}
