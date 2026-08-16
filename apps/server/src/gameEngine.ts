import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@meme-tunes/shared";
import { PLAYBACK_PAUSE_SECONDS } from "@meme-tunes/shared";
import type { Submission } from "@meme-tunes/shared";
import type { Lobby } from "./lobbyStore.js";
import { connectedPlayers, publicPlayers } from "./lobbyStore.js";
import { getRandomMemes } from "./memes.js";

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

const MEME_OPTIONS_COUNT = 3;

export async function startGame(io: GameServer, lobby: Lobby): Promise<void> {
  lobby.currentRoundNumber = 0;
  lobby.usedMemeUrls.clear();
  await startRound(io, lobby);
}

async function startRound(io: GameServer, lobby: Lobby): Promise<void> {
  lobby.currentRoundNumber += 1;
  lobby.currentSubmissions = [];
  lobby.phase = "round_meme_reveal";

  await beginMemePick(io, lobby);
}

function getCurrentPickerId(lobby: Lobby): string | null {
  const eligible = connectedPlayers(lobby);
  if (eligible.length === 0) return null;
  const index = (lobby.currentRoundNumber - 1) % eligible.length;
  return eligible[index].id;
}

async function beginMemePick(io: GameServer, lobby: Lobby, excludeExtra: Set<string> = new Set()): Promise<void> {
  const excluded = new Set([...lobby.usedMemeUrls, ...excludeExtra]);
  const memeOptions = await getRandomMemes(excluded, MEME_OPTIONS_COUNT);
  lobby.currentMemeOptions = memeOptions;

  const pickerId = getCurrentPickerId(lobby);
  lobby.currentPickerId = pickerId;
  const picker = pickerId ? lobby.players.get(pickerId) : undefined;

  const pickDeadlineTs = Date.now() + lobby.settings.memePickSeconds * 1000;

  io.to(lobby.code).emit("meme-pick-started", {
    roundNumber: lobby.currentRoundNumber,
    memeOptions,
    pickDeadlineTs,
    pickerId: pickerId ?? "",
    pickerName: picker?.name ?? "?",
  });

  lobby.memeVoteTimer = setTimeout(() => resolveMemePick(io, lobby, null), lobby.settings.memePickSeconds * 1000);
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
  if (lobby.memeVoteTimer) {
    clearTimeout(lobby.memeVoteTimer);
    lobby.memeVoteTimer = null;
  }
  beginMemePick(io, lobby, new Set(lobby.currentMemeOptions)).catch((err) =>
    console.error("Failed to reroll memes:", err)
  );
}

function resolveMemePick(io: GameServer, lobby: Lobby, chosenIndex: number | null): void {
  if (lobby.memeVoteTimer) {
    clearTimeout(lobby.memeVoteTimer);
    lobby.memeVoteTimer = null;
  }

  const index = chosenIndex ?? Math.floor(Math.random() * lobby.currentMemeOptions.length);
  const memeUrl = lobby.currentMemeOptions[index];

  lobby.usedMemeUrls.add(memeUrl);
  lobby.currentMemeUrl = memeUrl;
  lobby.currentPickerId = null;
  lobby.phase = "round_submitting";

  const submitDeadlineTs = Date.now() + lobby.settings.submitSeconds * 1000;
  lobby.submitDeadlineTs = submitDeadlineTs;

  io.to(lobby.code).emit("round-started", {
    roundNumber: lobby.currentRoundNumber,
    memeUrl,
    submitDeadlineTs,
  });

  lobby.submitTimer = setTimeout(() => closeSubmissions(io, lobby), lobby.settings.submitSeconds * 1000);
}

export function tryCloseSubmissionsEarly(io: GameServer, lobby: Lobby): void {
  if (lobby.phase !== "round_submitting") return;
  const submittedPlayerIds = new Set(lobby.currentSubmissions.map((s) => s.playerId));
  const allSubmitted = connectedPlayers(lobby).every((p) => submittedPlayerIds.has(p.id));
  if (allSubmitted) closeSubmissions(io, lobby);
}

function closeSubmissions(io: GameServer, lobby: Lobby): void {
  if (lobby.submitTimer) {
    clearTimeout(lobby.submitTimer);
    lobby.submitTimer = null;
  }
  lobby.phase = "round_playback";
  io.to(lobby.code).emit("submissions-closed");
  playSubmissions(io, lobby).catch((err) => console.error("Playback sequence failed:", err));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    io.to(lobby.code).emit("voting-open", submission.id);

    await delay(lobby.settings.playbackSeconds * 1000);

    lobby.currentVotingSubmissionId = null;
    io.to(lobby.code).emit("song-results", {
      submissionId: submission.id,
      upVotes: submission.upVotes.length,
      downVotes: submission.downVotes.length,
      ...(lobby.settings.anonymousVoting
        ? {}
        : {
            upVoterNames: submission.upVotes.map((id) => lobby.players.get(id)?.name ?? "?"),
            downVoterNames: submission.downVotes.map((id) => lobby.players.get(id)?.name ?? "?"),
          }),
    });

    await delay(PLAYBACK_PAUSE_SECONDS * 1000);
  }

  finishRound(io, lobby);
}

const ROUND_RESULTS_DISPLAY_MS = 15000;

function finishRound(io: GameServer, lobby: Lobby): void {
  for (const submission of lobby.currentSubmissions) {
    const player = lobby.players.get(submission.playerId);
    if (player) player.score += submission.upVotes.length - submission.downVotes.length;
  }

  lobby.phase = "round_results";

  const leaderboard = publicPlayers(lobby)
    .map((p) => ({ playerId: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);

  io.to(lobby.code).emit("round-leaderboard", leaderboard);

  setTimeout(() => {
    if (lobby.currentRoundNumber >= lobby.settings.totalRounds) {
      lobby.phase = "game_over";
      io.to(lobby.code).emit("game-over", leaderboard);
    } else {
      startRound(io, lobby).catch((err) => console.error("Failed to start next round:", err));
    }
  }, ROUND_RESULTS_DISPLAY_MS);
}
