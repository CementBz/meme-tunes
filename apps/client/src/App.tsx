import { useEffect, useState } from "react";
import type { LeaderboardEntry, LobbySettings, Player, SongSourceType, YoutubeSearchResult } from "@meme-tunes/shared";
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
import { HudScaleSlider } from "./components/HudScaleSlider";
import { MusicPlayer } from "./components/MusicPlayer";
import { PickerIndicator } from "./components/PickerIndicator";
import { RoundMusic } from "./components/RoundMusic";
import { RulesPanel } from "./components/RulesPanel";
import { RoundView } from "./components/RoundView";
import { PlaybackView } from "./components/PlaybackView";
import type { SongSubmission } from "./types";
import "./App.css";

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

function App() {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LobbySettings>(DEFAULT_SETTINGS);
  const [memePickData, setMemePickData] = useState<MemePickData | null>(null);
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
  const [paused, setPaused] = useState(false);
  const [uploadDeadlineTs, setUploadDeadlineTs] = useState<number | null>(null);
  const [communityVoteData, setCommunityVoteData] = useState<CommunityVoteData | null>(null);
  const [songHints, setSongHints] = useState<YoutubeSearchResult[]>([]);
  const [fireVoteUsedThisRound, setFireVoteUsedThisRound] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--hud-scale", String(hudScale));
  }, [hudScale]);

  useEffect(() => {
    const onLobbyUpdated = (updated: Player[]) => setPlayers(updated);
    const onSettingsUpdated = (updated: LobbySettings) => setSettings(updated);
    const onGameStarting = () => {
      setGameStarted(true);
      setGameStarting(true);
    };
    const onUploadsPhaseStarted = (data: { deadlineTs: number }) => {
      setGameStarting(false);
      setUploadDeadlineTs(data.deadlineTs);
      setRoundLeaderboard(null);
    };
    const onCommunityVoteStarted = (data: CommunityVoteData) => {
      setGameStarting(false);
      setUploadDeadlineTs(null);
      setCommunityVoteData(data);
      setRoundData(null);
      setNowPlaying(null);
      setSongResult(null);
      setRoundLeaderboard(null);
    };
    const onMemePickStarted = (data: MemePickData) => {
      setGameStarting(false);
      setMemePickData(data);
      setRoundData(null);
      setNowPlaying(null);
      setSongResult(null);
      setRoundLeaderboard(null);
    };
    const onRoundStarted = (data: RoundData) => {
      setMemePickData(null);
      setCommunityVoteData(null);
      setUploadDeadlineTs(null);
      setMusicOn(true);
      setRoundData(data);
      setCurrentRoundNumber(data.roundNumber);
      setSubmissionsClosed(false);
      setHasSubmitted(false);
      setNowPlaying(null);
      setSongResult(null);
      setSongHints([]);
      setVotedSubmissionIds(new Set());
      setFireVoteUsedThisRound(false);
    };
    const onSongHints = (data: { roundNumber: number; hints: YoutubeSearchResult[] }) => {
      setSongHints(data.hints);
    };
    const onSubmissionsClosed = () => setSubmissionsClosed(true);
    const onNowPlaying = (data: NowPlaying) => {
      setNowPlaying(data);
      setSongResult(null);
    };
    const onSongResults = (data: SongResult) => setSongResult(data);
    const onRoundLeaderboard = (entries: LeaderboardEntry[]) => {
      setNowPlaying(null);
      setRoundData(null);
      setSongResult(null);
      setRoundLeaderboard(entries);
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

    socket.on("lobby-updated", onLobbyUpdated);
    socket.on("settings-updated", onSettingsUpdated);
    socket.on("game-starting", onGameStarting);
    socket.on("uploads-phase-started", onUploadsPhaseStarted);
    socket.on("community-vote-started", onCommunityVoteStarted);
    socket.on("meme-pick-started", onMemePickStarted);
    socket.on("round-started", onRoundStarted);
    socket.on("song-hints", onSongHints);
    socket.on("submissions-closed", onSubmissionsClosed);
    socket.on("now-playing", onNowPlaying);
    socket.on("song-results", onSongResults);
    socket.on("round-leaderboard", onRoundLeaderboard);
    socket.on("game-over", onGameOver);
    socket.on("error-message", onErrorMessage);
    socket.on("game-paused", onGamePaused);
    socket.on("game-resumed", onGameResumed);
    socket.on("deadline-updated", onDeadlineUpdated);

    return () => {
      socket.off("lobby-updated", onLobbyUpdated);
      socket.off("settings-updated", onSettingsUpdated);
      socket.off("game-starting", onGameStarting);
      socket.off("uploads-phase-started", onUploadsPhaseStarted);
      socket.off("community-vote-started", onCommunityVoteStarted);
      socket.off("meme-pick-started", onMemePickStarted);
      socket.off("round-started", onRoundStarted);
      socket.off("song-hints", onSongHints);
      socket.off("submissions-closed", onSubmissionsClosed);
      socket.off("now-playing", onNowPlaying);
      socket.off("song-results", onSongResults);
      socket.off("round-leaderboard", onRoundLeaderboard);
      socket.off("game-over", onGameOver);
      socket.off("error-message", onErrorMessage);
      socket.off("game-paused", onGamePaused);
      socket.off("game-resumed", onGameResumed);
      socket.off("deadline-updated", onDeadlineUpdated);
    };
  }, []);

  const handleCreate = (name: string) => {
    setError(null);
    socket.emit("create-lobby", name, ({ code, playerId }) => {
      setLobbyCode(code);
      setMyPlayerId(playerId);
    });
  };

  const handleJoin = (name: string, code: string) => {
    setError(null);
    socket.emit("join-lobby", code, name, (res) => {
      if (res.ok) {
        setLobbyCode(code.toUpperCase());
        setMyPlayerId(res.playerId);
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

  const handleLeaveLobby = () => {
    socket.emit("leave-lobby");
    setLobbyCode(null);
    setMyPlayerId(null);
    setPlayers([]);
    setGameError(null);
    setMemePickData(null);
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
    setSongHints([]);
    setFireVoteUsedThisRound(false);
    setSettings(DEFAULT_SETTINGS);
  };

  let screen;
  if (lobbyCode && myPlayerId) {
    if (finalLeaderboard) {
      screen = <GameOverView entries={finalLeaderboard} />;
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
          songHints={songHints}
          onSubmit={handleSongSubmit}
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
    } else if (roundLeaderboard) {
      screen = <LeaderboardView entries={roundLeaderboard} roundNumber={currentRoundNumber} />;
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
        />
      );
    }
  } else {
    screen = <HomeScreen onCreate={handleCreate} onJoin={handleJoin} error={error} />;
  }

  return (
    <>
      <MusicPlayer
        phaseAllowsMusic={!gameStarted}
        prankEnabled={!gameStarted}
        musicOn={musicOn}
        onToggle={setMusicOn}
      />
      <RoundMusic playing={musicOn && Boolean(roundData) && !nowPlaying && !roundLeaderboard && !finalLeaderboard} />
      <RulesPanel />
      {lobbyCode && <LeaveButton onLeave={handleLeaveLobby} />}
      {memePickData && (
        <PickerIndicator pickerName={memePickData.pickerName} isMe={memePickData.pickerId === myPlayerId} />
      )}
      {screen}
      <HudScaleSlider value={hudScale} onChange={setHudScale} />
      <div style={{ position: "fixed", bottom: "8px", right: "8px", zIndex: 900, display: "flex", gap: "0.75rem" }}>
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
