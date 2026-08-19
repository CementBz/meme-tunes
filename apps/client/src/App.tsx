import { useEffect, useRef, useState } from "react";
import type {
  LeaderboardEntry,
  LobbySettings,
  Player,
  RoundSubmissionSummary,
  SongSourceType,
  TripleVoteKind,
  TripleVoteOption,
} from "@meme-tunes/shared";
import { DEFAULT_SETTINGS } from "@meme-tunes/shared";
import { socket } from "./socket";
import { CommunityVoteView } from "./components/CommunityVoteView";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { GameOverView } from "./components/GameOverView";
import { HomeScreen } from "./components/HomeScreen";
import { LeaderboardView } from "./components/LeaderboardView";
import { LeaveButton } from "./components/LeaveButton";
import { LobbyRoom } from "./components/LobbyRoom";
import { MemePickView } from "./components/MemePickView";
import { MemeUploadView } from "./components/MemeUploadView";
import { MusicPlayer } from "./components/MusicPlayer";
import { OwnMemePickView } from "./components/OwnMemePickView";
import { RoundMusic } from "./components/RoundMusic";
import { RulesPanel } from "./components/RulesPanel";
import { RoundView } from "./components/RoundView";
import { PhoneMockup } from "./components/PhoneMockup";
import { PlaybackView } from "./components/PlaybackView";
import { TripleVoteView } from "./components/TripleVoteView";
import type { SongSubmission } from "./types";
import "./App.css";

const SESSION_KEY = "meme-tunes-session";

interface StoredSession {
  code: string;
  playerId: string;
}

// sessionStorage, not localStorage: it survives a reload (the original goal)
// but is isolated per tab, so two tabs open in the same browser can't read
// or overwrite each other's session and end up hijacking one another's
// player identity.
function loadStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.code === "string" && typeof parsed?.playerId === "string") return parsed;
  } catch {
    // sessionStorage unavailable (private browsing etc.) — just skip persistence
  }
  return null;
}

function saveStoredSession(session: StoredSession | null): void {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

interface MemePickData {
  roundNumber: number;
  memeOptions: string[];
  pickDeadlineTs: number;
  pickerId: string;
  pickerName: string;
}

interface RoundData {
  roundNumber: number;
  memeUrl: string;
  submitDeadlineTs: number;
}

interface CommunityVoteData {
  roundNumber: number;
  options: string[];
  voteDeadlineTs: number;
}

interface NowPlaying {
  submissionId: string;
  source: SongSourceType;
  videoId: string | null;
  fileUrl: string | null;
  startSeconds: number;
  playerId: string;
  playerName: string;
  thumbnailUrl: string;
  memeText: string | null;
  memeTextPosition: "top" | "bottom" | null;
}

interface SongResult {
  submissionId: string;
  upVotes: number;
  downVotes: number;
  neutralVotes: number;
  fireVotes: number;
  upVoterNames?: string[];
  downVoterNames?: string[];
  neutralVoterNames?: string[];
  fireVoterNames?: string[];
}

// Keeps the phone flush with the browser window's top and bottom edges
// (when one is on screen) instead of sitting at an arbitrary fixed size/offset.
function useBrowserAlignment(): { bottomOffset: number; height: string | undefined } {
  const [bottomOffset, setBottomOffset] = useState(16);
  const [height, setHeight] = useState<string | undefined>(undefined);

  useEffect(() => {
    const compute = () => {
      const el = document.querySelector(".browser-window-outer");
      if (!el) {
        setBottomOffset(16);
        setHeight(undefined);
        return;
      }
      const rect = el.getBoundingClientRect();
      setBottomOffset(Math.max(16, Math.round(window.innerHeight - rect.bottom)));
      setHeight(`${Math.round(rect.height)}px`);
    };
    compute();
    const resizeObserver = new ResizeObserver(compute);
    const el = document.querySelector(".browser-window-outer");
    if (el) resizeObserver.observe(el);
    window.addEventListener("resize", compute);
    const interval = setInterval(compute, 400);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", compute);
      clearInterval(interval);
    };
  });

  return { bottomOffset, height };
}

function App() {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LobbySettings>(DEFAULT_SETTINGS);
  const [memePickData, setMemePickData] = useState<MemePickData | null>(null);
  const [pickerAnnounce, setPickerAnnounce] = useState<{ pickerId: string; pickerName: string } | null>(null);
  const pickerAnnounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [submissionsClosed, setSubmissionsClosed] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [songResult, setSongResult] = useState<SongResult | null>(null);
  const [votedSubmissionIds, setVotedSubmissionIds] = useState<Set<string>>(new Set());
  const [hudScale, setHudScale] = useState(1);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [roundLeaderboard, setRoundLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.05);
  const [prankEnabled, setPrankEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [uploadDeadlineTs, setUploadDeadlineTs] = useState<number | null>(null);
  const [communityVoteData, setCommunityVoteData] = useState<CommunityVoteData | null>(null);
  const [previewVolume, setPreviewVolume] = useState(0.5);
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<Set<string>>(new Set());
  const [textOnMemeAllowed, setTextOnMemeAllowed] = useState(false);
  const [feedItems, setFeedItems] = useState<{ id: string; text: string }[]>([]);
  const [showRoundEndOverlay, setShowRoundEndOverlay] = useState(false);
  const [roundSubmissions, setRoundSubmissions] = useState<RoundSubmissionSummary[]>([]);

  const pushFeedItem = (text: string) => {
    setFeedItems((prev) => [...prev.slice(-19), { id: `${Date.now()}-${Math.random()}`, text }]);
  };

  // Read via a ref inside socket handlers registered once with [] deps below,
  // so the feed always resolves against the current player list instead of
  // whatever it was when the listener effect first ran.
  const playersRef = useRef<Player[]>([]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  const [fireVoteUsedThisRound, setFireVoteUsedThisRound] = useState(false);
  const [reconnecting, setReconnecting] = useState(() => loadStoredSession() !== null);
  const [tripleVoteData, setTripleVoteData] = useState<{
    kind: TripleVoteKind;
    options: TripleVoteOption[];
    voteDeadlineTs: number;
  } | null>(null);
  const [tripleVotedKey, setTripleVotedKey] = useState<string | null>(null);
  const [tripleResolvedKey, setTripleResolvedKey] = useState<string | null>(null);
  const [ownMemePickData, setOwnMemePickData] = useState<{ deadlineTs: number } | null>(null);
  const [extraTimeState, setExtraTimeState] = useState<{
    voteDeadlineTs: number;
    yesVotes: number;
    eligibleVoters: number;
  } | null>(null);
  const [extraTimeResult, setExtraTimeResult] = useState<boolean | null>(null);
  const [hasRequestedExtraTime, setHasRequestedExtraTime] = useState(false);
  const [hasVotedExtraTime, setHasVotedExtraTime] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--hud-scale", String(hudScale));
  }, [hudScale]);

  // A page reload wipes all client state, but the socket connection (and
  // thus the player's slot in the lobby) is gone anyway by then — so on
  // mount, try to resume the same lobby under the new socket id using the
  // session persisted in sessionStorage, instead of dropping back to the
  // home screen mid-game.
  //
  // rejoinAttemptedRef guards against React StrictMode's dev-only double
  // effect invocation firing this twice: two concurrent rejoin requests
  // would both read the same (stale) stored playerId, and whichever one
  // the server processes second would fail with "player not found" (since
  // the first request already re-keyed that id) and wipe the session that
  // the first, successful request had just saved.
  const rejoinAttemptedRef = useRef(false);
  useEffect(() => {
    if (rejoinAttemptedRef.current) return;
    rejoinAttemptedRef.current = true;

    const stored = loadStoredSession();
    if (!stored) return;

    socket.emit("rejoin-lobby", stored.code, stored.playerId, (res) => {
      if (!res.ok) {
        saveStoredSession(null);
        setReconnecting(false);
        return;
      }

      const snapshot = res.snapshot;
      saveStoredSession({ code: stored.code, playerId: res.playerId });
      setLobbyCode(stored.code);
      setMyPlayerId(res.playerId);

      setPlayers(snapshot.players);
      setSettings(snapshot.settings);
      setPaused(snapshot.paused);
      setCurrentRoundNumber(snapshot.currentRoundNumber);
      setGameStarted(snapshot.phase !== "waiting");
      setGameStarting(false);
      setMemePickData(snapshot.memePickData);
      setRoundData(snapshot.roundData);
      setHasSubmitted(snapshot.hasSubmitted);
      setSubmissionsClosed(snapshot.submissionsClosed);
      setCommunityVoteData(snapshot.communityVoteData);
      setUploadDeadlineTs(snapshot.uploadDeadlineTs);
      setNowPlaying(snapshot.nowPlaying);
      setVotedSubmissionIds(new Set(snapshot.votedSubmissionIds));
      setSubmittedPlayerIds(new Set(snapshot.submittedPlayerIds));
      setTextOnMemeAllowed(snapshot.textOnMemeAllowed);
      setFireVoteUsedThisRound(snapshot.fireVoteUsed);
      setExtraTimeState(snapshot.extraTimeState);
      setRoundLeaderboard(snapshot.roundLeaderboard);
      setRoundSubmissions(snapshot.roundSubmissions ?? []);
      setFinalLeaderboard(snapshot.finalLeaderboard);

      setReconnecting(false);
    });
  }, []);

  useEffect(() => {
    const onLobbyUpdated = (updated: Player[]) => setPlayers(updated);
    const onSettingsUpdated = (updated: LobbySettings) => setSettings(updated);
    const onGameStarting = () => {
      setGameStarted(true);
      setGameStarting(true);
    };
    const onTripleVoteStarted = (data: { kind: TripleVoteKind; options: TripleVoteOption[]; voteDeadlineTs: number }) => {
      setGameStarting(false);
      setTripleVoteData(data);
      setTripleVotedKey(null);
      setTripleResolvedKey(null);
      setOwnMemePickData(null);
      setUploadDeadlineTs(null);
    };
    const onTripleVoteResolved = (data: { kind: TripleVoteKind; winningKey: string }) => {
      setTripleResolvedKey(data.winningKey);
      if (data.kind === "meme_text") setTextOnMemeAllowed(data.winningKey === "yes");
    };
    const onSubmissionReceived = (playerId: string) => {
      setSubmittedPlayerIds((prev) => new Set(prev).add(playerId));
      const name = playersRef.current.find((p) => p.id === playerId)?.name ?? "Jemand";
      pushFeedItem(`🎵 ${name} hat sein Tune abgegeben`);
    };
    const onPlayerJoinedFeed = (name: string) => pushFeedItem(`🎉 ${name} ist beigetreten`);
    const onPlayerLeftFeed = (name: string) => pushFeedItem(`👋 ${name} hat verlassen`);
    const onChatMessage = (data: { id: string; playerName: string; text: string }) =>
      pushFeedItem(`💬 ${data.playerName}: ${data.text}`);
    const onOwnMemePickStarted = (data: { deadlineTs: number }) => {
      setGameStarting(false);
      setTripleVoteData(null);
      setOwnMemePickData(data);
      setUploadDeadlineTs(null);
      setCommunityVoteData(null);
      setMemePickData(null);
      setPickerAnnounce(null);
      setRoundData(null);
      setNowPlaying(null);
      setSongResult(null);
      setRoundLeaderboard(null);
    };
    const onUploadsPhaseStarted = (data: { deadlineTs: number }) => {
      setGameStarting(false);
      setTripleVoteData(null);
      setUploadDeadlineTs(data.deadlineTs);
      setRoundLeaderboard(null);
    };
    const onCommunityVoteStarted = (data: CommunityVoteData) => {
      setGameStarting(false);
      setTripleVoteData(null);
      setOwnMemePickData(null);
      setUploadDeadlineTs(null);
      setCommunityVoteData(data);
      setRoundData(null);
      setNowPlaying(null);
      setSongResult(null);
      setRoundLeaderboard(null);
    };
    const onMemePickStarted = (data: MemePickData) => {
      setGameStarting(false);
      setTripleVoteData(null);
      setOwnMemePickData(null);
      setMemePickData(data);
      setRoundData(null);
      setNowPlaying(null);
      setSongResult(null);
      setRoundLeaderboard(null);
      if (pickerAnnounceTimeoutRef.current) clearTimeout(pickerAnnounceTimeoutRef.current);
      setPickerAnnounce({ pickerId: data.pickerId, pickerName: data.pickerName });
      pickerAnnounceTimeoutRef.current = setTimeout(() => setPickerAnnounce(null), 4000);
    };
    const onRoundStarted = (data: RoundData) => {
      setOwnMemePickData(null);
      setMemePickData(null);
      setPickerAnnounce(null);
      setCommunityVoteData(null);
      setUploadDeadlineTs(null);
      setSubmittedPlayerIds(new Set());
      setShowRoundEndOverlay(false);
      setRoundSubmissions([]);
      setMusicOn(true);
      setRoundData(data);
      setCurrentRoundNumber(data.roundNumber);
      setSubmissionsClosed(false);
      setHasSubmitted(false);
      setNowPlaying(null);
      setSongResult(null);
      setVotedSubmissionIds(new Set());
      setFireVoteUsedThisRound(false);
      setExtraTimeState(null);
      setExtraTimeResult(null);
      setHasRequestedExtraTime(false);
      setHasVotedExtraTime(false);
    };
    const onSubmissionsClosed = () => {
      setSubmissionsClosed(true);
      setShowRoundEndOverlay(true);
      setTimeout(() => setShowRoundEndOverlay(false), 4000);
    };
    const onNowPlaying = (data: NowPlaying) => {
      setNowPlaying(data);
      setSongResult(null);
    };
    const onSongResults = (data: SongResult) => setSongResult(data);
    const onRoundLeaderboard = (data: { entries: LeaderboardEntry[]; roundSubmissions: RoundSubmissionSummary[] }) => {
      setNowPlaying(null);
      setRoundData(null);
      setSongResult(null);
      setRoundLeaderboard(data.entries);
      setRoundSubmissions(data.roundSubmissions);
    };
    const onGameOver = (entries: LeaderboardEntry[]) => {
      setRoundLeaderboard(null);
      setFinalLeaderboard(entries);
    };
    const onErrorMessage = (message: string) => setGameError(message);
    const onGamePaused = () => setPaused(true);
    const onGameResumed = () => setPaused(false);
    const onDeadlineUpdated = (data: {
      pickDeadlineTs?: number;
      submitDeadlineTs?: number;
      voteDeadlineTs?: number;
      uploadDeadlineTs?: number;
    }) => {
      if (data.pickDeadlineTs !== undefined) {
        setMemePickData((prev) => (prev ? { ...prev, pickDeadlineTs: data.pickDeadlineTs! } : prev));
      }
      if (data.submitDeadlineTs !== undefined) {
        setRoundData((prev) => (prev ? { ...prev, submitDeadlineTs: data.submitDeadlineTs! } : prev));
      }
      if (data.voteDeadlineTs !== undefined) {
        setCommunityVoteData((prev) => (prev ? { ...prev, voteDeadlineTs: data.voteDeadlineTs! } : prev));
      }
      if (data.uploadDeadlineTs !== undefined) {
        setUploadDeadlineTs(data.uploadDeadlineTs);
      }
    };
    const onExtraTimeStarted = (data: { voteDeadlineTs: number; yesVotes: number; eligibleVoters: number }) => {
      setExtraTimeState(data);
      setExtraTimeResult(null);
    };
    const onExtraTimeUpdated = (data: { yesVotes: number; eligibleVoters: number }) => {
      setExtraTimeState((prev) => (prev ? { ...prev, ...data } : prev));
    };
    const onExtraTimeResolved = (data: { granted: boolean }) => {
      setExtraTimeState(null);
      setExtraTimeResult(data.granted);
      setHasRequestedExtraTime(false);
      setHasVotedExtraTime(false);
      setTimeout(() => setExtraTimeResult(null), 2500);
    };

    socket.on("lobby-updated", onLobbyUpdated);
    socket.on("settings-updated", onSettingsUpdated);
    socket.on("game-starting", onGameStarting);
    socket.on("triple-vote-started", onTripleVoteStarted);
    socket.on("triple-vote-resolved", onTripleVoteResolved);
    socket.on("own-meme-pick-started", onOwnMemePickStarted);
    socket.on("uploads-phase-started", onUploadsPhaseStarted);
    socket.on("community-vote-started", onCommunityVoteStarted);
    socket.on("meme-pick-started", onMemePickStarted);
    socket.on("round-started", onRoundStarted);
    socket.on("submission-received", onSubmissionReceived);
    socket.on("player-joined-feed", onPlayerJoinedFeed);
    socket.on("player-left-feed", onPlayerLeftFeed);
    socket.on("chat-message", onChatMessage);
    socket.on("submissions-closed", onSubmissionsClosed);
    socket.on("now-playing", onNowPlaying);
    socket.on("song-results", onSongResults);
    socket.on("round-leaderboard", onRoundLeaderboard);
    socket.on("game-over", onGameOver);
    socket.on("error-message", onErrorMessage);
    socket.on("game-paused", onGamePaused);
    socket.on("game-resumed", onGameResumed);
    socket.on("deadline-updated", onDeadlineUpdated);
    socket.on("extra-time-started", onExtraTimeStarted);
    socket.on("extra-time-updated", onExtraTimeUpdated);
    socket.on("extra-time-resolved", onExtraTimeResolved);

    return () => {
      socket.off("lobby-updated", onLobbyUpdated);
      socket.off("settings-updated", onSettingsUpdated);
      socket.off("game-starting", onGameStarting);
      socket.off("triple-vote-started", onTripleVoteStarted);
      socket.off("triple-vote-resolved", onTripleVoteResolved);
      socket.off("own-meme-pick-started", onOwnMemePickStarted);
      socket.off("uploads-phase-started", onUploadsPhaseStarted);
      socket.off("community-vote-started", onCommunityVoteStarted);
      socket.off("meme-pick-started", onMemePickStarted);
      socket.off("round-started", onRoundStarted);
      socket.off("submission-received", onSubmissionReceived);
      socket.off("player-joined-feed", onPlayerJoinedFeed);
      socket.off("player-left-feed", onPlayerLeftFeed);
      socket.off("chat-message", onChatMessage);
      socket.off("submissions-closed", onSubmissionsClosed);
      socket.off("now-playing", onNowPlaying);
      socket.off("song-results", onSongResults);
      socket.off("round-leaderboard", onRoundLeaderboard);
      socket.off("game-over", onGameOver);
      socket.off("error-message", onErrorMessage);
      socket.off("game-paused", onGamePaused);
      socket.off("game-resumed", onGameResumed);
      socket.off("deadline-updated", onDeadlineUpdated);
      socket.off("extra-time-started", onExtraTimeStarted);
      socket.off("extra-time-updated", onExtraTimeUpdated);
      socket.off("extra-time-resolved", onExtraTimeResolved);
    };
  }, []);

  const handleCreate = (name: string) => {
    setError(null);
    socket.emit("create-lobby", name, ({ code, playerId }) => {
      setLobbyCode(code);
      setMyPlayerId(playerId);
      saveStoredSession({ code, playerId });
    });
  };

  const handleJoin = (name: string, code: string) => {
    setError(null);
    socket.emit("join-lobby", code, name, (res) => {
      if (res.ok) {
        const upperCode = code.toUpperCase();
        setLobbyCode(upperCode);
        setMyPlayerId(res.playerId);
        saveStoredSession({ code: upperCode, playerId: res.playerId });
      } else {
        setError(res.error);
      }
    });
  };

  const handleUpdateSettings = (update: Partial<LobbySettings>) => {
    socket.emit("update-settings", update);
  };

  const handleStartGame = () => {
    setGameError(null);
    socket.emit("start-game");
  };

  const handleTripleVote = (key: string) => {
    if (!tripleVoteData || tripleVotedKey) return;
    socket.emit("submit-triple-vote", tripleVoteData.kind, key);
    setTripleVotedKey(key);
  };

  const handleMemePick = (index: number) => {
    socket.emit("submit-meme-pick", index);
  };

  const handleRerollMemes = () => {
    socket.emit("reroll-memes");
  };

  const handleMemeUpload = (url: string) => {
    socket.emit("submit-meme-upload", url);
  };

  const handleCommunityVote = (index: number) => {
    socket.emit("submit-community-vote", index);
  };

  const handleSongSubmit = (data: SongSubmission) => {
    socket.emit("submit-song", data);
    setHasSubmitted(true);
  };

  const handleVote = (vote: "up" | "down" | "meh") => {
    if (!nowPlaying) return;
    socket.emit("submit-vote", nowPlaying.submissionId, vote);
    setVotedSubmissionIds((prev) => new Set(prev).add(nowPlaying.submissionId));
  };

  const handleFireVote = () => {
    if (!nowPlaying || fireVoteUsedThisRound) return;
    socket.emit("submit-fire-vote", nowPlaying.submissionId);
    setFireVoteUsedThisRound(true);
  };

  const handleRequestExtraTime = () => {
    if (hasRequestedExtraTime) return;
    socket.emit("request-extra-time");
    setHasRequestedExtraTime(true);
  };

  const handleVoteExtraTime = () => {
    if (hasVotedExtraTime) return;
    socket.emit("vote-extra-time");
    setHasVotedExtraTime(true);
  };

  const handleForceSkipLeaderboard = () => {
    socket.emit("force-skip-leaderboard");
  };

  const handleSendChatMessage = (text: string) => {
    socket.emit("send-chat-message", text);
  };

  const handleLeaveLobby = () => {
    socket.emit("leave-lobby");
    saveStoredSession(null);
    setLobbyCode(null);
    setMyPlayerId(null);
    setPlayers([]);
    setGameError(null);
    setMemePickData(null);
    setPickerAnnounce(null);
    setRoundData(null);
    setSubmissionsClosed(false);
    setHasSubmitted(false);
    setNowPlaying(null);
    setSongResult(null);
    setVotedSubmissionIds(new Set());
    setRoundLeaderboard(null);
    setFinalLeaderboard(null);
    setGameStarted(false);
    setGameStarting(false);
    setPaused(false);
    setUploadDeadlineTs(null);
    setCommunityVoteData(null);
    setFireVoteUsedThisRound(false);
    setExtraTimeState(null);
    setExtraTimeResult(null);
    setHasRequestedExtraTime(false);
    setHasVotedExtraTime(false);
    setTripleVoteData(null);
    setTripleVotedKey(null);
    setTripleResolvedKey(null);
    setOwnMemePickData(null);
    setSubmittedPlayerIds(new Set());
    setTextOnMemeAllowed(false);
    setFeedItems([]);
    setShowRoundEndOverlay(false);
    setRoundSubmissions([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const isHost = players.find((p) => p.id === myPlayerId)?.isHost ?? false;

  let screen;
  if (reconnecting) {
    screen = (
      <section id="center">
        <div className="hud-scale-content">
          <p>Verbinde erneut…</p>
        </div>
      </section>
    );
  } else if (lobbyCode && myPlayerId) {
    if (finalLeaderboard) {
      screen = <GameOverView entries={finalLeaderboard} />;
    } else if (showRoundEndOverlay) {
      screen = (
        <section id="center">
          <div className="hud-scale-content">
            <h1 style={{ fontSize: "4rem" }}>Zeit abgelaufen</h1>
          </div>
        </section>
      );
    } else if (pickerAnnounce) {
      const isMe = pickerAnnounce.pickerId === myPlayerId;
      screen = (
        <section id="center">
          <div className="hud-scale-content">
            <h1 style={{ fontSize: "4.5rem", color: isMe ? "#22c55e" : "#ef4444" }}>
              {isMe ? "Du wählst das Meme!" : `${pickerAnnounce.pickerName} wählt das Meme`}
            </h1>
          </div>
        </section>
      );
    } else if (nowPlaying) {
      screen = (
        <PlaybackView
          submissionId={nowPlaying.submissionId}
          source={nowPlaying.source}
          videoId={nowPlaying.videoId}
          fileUrl={nowPlaying.fileUrl}
          startSeconds={nowPlaying.startSeconds}
          playerName={nowPlaying.playerName}
          memeUrl={roundData?.memeUrl ?? ""}
          memeText={nowPlaying.memeText}
          memeTextPosition={nowPlaying.memeTextPosition}
          canVote={nowPlaying.playerId !== myPlayerId}
          hasVoted={votedSubmissionIds.has(nowPlaying.submissionId)}
          onVote={handleVote}
          canFireVote={nowPlaying.playerId !== myPlayerId && !fireVoteUsedThisRound}
          onFireVote={handleFireVote}
          result={songResult && songResult.submissionId === nowPlaying.submissionId ? songResult : null}
        />
      );
    } else if (roundData) {
      screen = (
        <RoundView
          roundNumber={roundData.roundNumber}
          totalRounds={settings.totalRounds}
          memeUrl={roundData.memeUrl}
          submitDeadlineTs={roundData.submitDeadlineTs}
          submissionsClosed={submissionsClosed}
          hasSubmitted={hasSubmitted}
          paused={paused}
          textOnMemeAllowed={textOnMemeAllowed}
          onSubmit={handleSongSubmit}
          extraTimeState={extraTimeState}
          extraTimeResult={extraTimeResult}
          hasRequestedExtraTime={hasRequestedExtraTime}
          hasVotedExtraTime={hasVotedExtraTime}
          onRequestExtraTime={handleRequestExtraTime}
          onVoteExtraTime={handleVoteExtraTime}
          players={players}
          submittedPlayerIds={submittedPlayerIds}
          isHost={isHost}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          hudScale={hudScale}
          onHudScaleChange={setHudScale}
          previewVolume={previewVolume}
          onPreviewVolumeChange={setPreviewVolume}
        />
      );
    } else if (communityVoteData) {
      screen = (
        <CommunityVoteView
          roundNumber={communityVoteData.roundNumber}
          totalRounds={settings.totalRounds}
          options={communityVoteData.options}
          voteDeadlineTs={communityVoteData.voteDeadlineTs}
          paused={paused}
          onVote={handleCommunityVote}
        />
      );
    } else if (uploadDeadlineTs !== null) {
      screen = <MemeUploadView deadlineTs={uploadDeadlineTs} paused={paused} onUpload={handleMemeUpload} />;
    } else if (memePickData) {
      screen = (
        <MemePickView
          roundNumber={memePickData.roundNumber}
          totalRounds={settings.totalRounds}
          memeOptions={memePickData.memeOptions}
          pickDeadlineTs={memePickData.pickDeadlineTs}
          pickerId={memePickData.pickerId}
          pickerName={memePickData.pickerName}
          myPlayerId={myPlayerId}
          paused={paused}
          onPick={handleMemePick}
          onReroll={handleRerollMemes}
        />
      );
    } else if (tripleVoteData) {
      screen = (
        <TripleVoteView
          options={tripleVoteData.options}
          voteDeadlineTs={tripleVoteData.voteDeadlineTs}
          votedKey={tripleVotedKey}
          resolvedKey={tripleResolvedKey}
          onVote={handleTripleVote}
        />
      );
    } else if (ownMemePickData) {
      screen = <OwnMemePickView deadlineTs={ownMemePickData.deadlineTs} />;
    } else if (roundLeaderboard) {
      screen = (
        <LeaderboardView
          entries={roundLeaderboard}
          roundNumber={currentRoundNumber}
          roundSubmissions={roundSubmissions}
          isHost={isHost}
          onForceSkip={handleForceSkipLeaderboard}
        />
      );
    } else if (gameStarting) {
      screen = <CountdownOverlay />;
    } else {
      screen = (
        <LobbyRoom
          code={lobbyCode}
          players={players}
          myPlayerId={myPlayerId}
          settings={settings}
          onStart={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
          error={gameError}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          hudScale={hudScale}
          onHudScaleChange={setHudScale}
        />
      );
    }
  } else {
    screen = <HomeScreen onCreate={handleCreate} onJoin={handleJoin} error={error} />;
  }

  const onLobbyRoomScreen = Boolean(lobbyCode && myPlayerId && !gameStarted && !reconnecting);
  // RoundView has its own Personal-Settings tab with a volume slider, same
  // as the waiting room — so the floating button would just be redundant.
  const onRoundViewScreen = Boolean(
    lobbyCode && myPlayerId && !reconnecting && !finalLeaderboard && !showRoundEndOverlay && !nowPlaying && roundData
  );
  const showPhone = Boolean(lobbyCode && myPlayerId && !reconnecting && !finalLeaderboard);
  const { bottomOffset: phoneBottomOffset, height: phoneHeight } = useBrowserAlignment();

  return (
    <>
      <MusicPlayer
        phaseAllowsMusic={!gameStarted}
        prankEnabled={prankEnabled}
        musicOn={musicOn}
        onToggle={setMusicOn}
        volume={musicVolume}
        showButton={!onLobbyRoomScreen && !onRoundViewScreen}
      />
      <RoundMusic playing={musicOn && Boolean(roundData) && !nowPlaying && !roundLeaderboard && !finalLeaderboard} />
      {!onLobbyRoomScreen && <RulesPanel />}
      {lobbyCode && <LeaveButton onLeave={handleLeaveLobby} />}
      {showPhone && (
        <div style={{ position: "fixed", bottom: `${phoneBottomOffset}px`, right: "16px", zIndex: 940 }}>
          <PhoneMockup items={feedItems} onSendMessage={handleSendChatMessage} height={phoneHeight} />
        </div>
      )}
      {screen}
      <div style={{ position: "fixed", bottom: "8px", right: "8px", zIndex: 900, display: "flex", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={() => setPrankEnabled((v) => !v)}
          style={{ background: "none", border: "none", boxShadow: "none", padding: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
        >
          {prankEnabled ? "Musik-Prank aus" : "Musik-Prank an"}
        </button>
        <a href="/privacy" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>
          Datenschutz
        </a>
        <a href="/terms" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>
          Nutzungsbedingungen
        </a>
      </div>
    </>
  );
}

export default App;
