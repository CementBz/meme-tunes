import { useEffect, useState } from "react";
import type { LeaderboardEntry, LobbySettings, Player, SongSourceType } from "@meme-tunes/shared";
import { DEFAULT_SETTINGS } from "@meme-tunes/shared";
import { socket } from "./socket";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { GameOverView } from "./components/GameOverView";
import { HomeScreen } from "./components/HomeScreen";
import { LeaderboardView } from "./components/LeaderboardView";
import { LeaveButton } from "./components/LeaveButton";
import { LobbyRoom } from "./components/LobbyRoom";
import { MemePickView } from "./components/MemePickView";
import { HudScaleSlider } from "./components/HudScaleSlider";
import { MusicPlayer } from "./components/MusicPlayer";
import { PickerIndicator } from "./components/PickerIndicator";
import { RoundMusic } from "./components/RoundMusic";
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
  upVoterNames?: string[];
  downVoterNames?: string[];
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
      setRoundData(data);
      setCurrentRoundNumber(data.roundNumber);
      setSubmissionsClosed(false);
      setHasSubmitted(false);
      setNowPlaying(null);
      setSongResult(null);
      setVotedSubmissionIds(new Set());
    };
    const onSubmissionsClosed = () => setSubmissionsClosed(true);
    const onNowPlaying = (data: NowPlaying) => {
      setNowPlaying(data);
      setSongResult(null);
    };
    const onSongResults = (data: SongResult) => setSongResult(data);
    const onRoundLeaderboard = (entries: LeaderboardEntry[]) => {
      setNowPlaying(null);
      setRoundLeaderboard(entries);
    };
    const onGameOver = (entries: LeaderboardEntry[]) => {
      setRoundLeaderboard(null);
      setFinalLeaderboard(entries);
    };
    const onErrorMessage = (message: string) => setGameError(message);

    socket.on("lobby-updated", onLobbyUpdated);
    socket.on("settings-updated", onSettingsUpdated);
    socket.on("game-starting", onGameStarting);
    socket.on("meme-pick-started", onMemePickStarted);
    socket.on("round-started", onRoundStarted);
    socket.on("submissions-closed", onSubmissionsClosed);
    socket.on("now-playing", onNowPlaying);
    socket.on("song-results", onSongResults);
    socket.on("round-leaderboard", onRoundLeaderboard);
    socket.on("game-over", onGameOver);
    socket.on("error-message", onErrorMessage);

    return () => {
      socket.off("lobby-updated", onLobbyUpdated);
      socket.off("settings-updated", onSettingsUpdated);
      socket.off("game-starting", onGameStarting);
      socket.off("meme-pick-started", onMemePickStarted);
      socket.off("round-started", onRoundStarted);
      socket.off("submissions-closed", onSubmissionsClosed);
      socket.off("now-playing", onNowPlaying);
      socket.off("song-results", onSongResults);
      socket.off("round-leaderboard", onRoundLeaderboard);
      socket.off("game-over", onGameOver);
      socket.off("error-message", onErrorMessage);
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

  const handleSongSubmit = (data: SongSubmission) => {
    socket.emit("submit-song", data);
    setHasSubmitted(true);
  };

  const handleVote = (vote: "up" | "down") => {
    if (!nowPlaying) return;
    socket.emit("submit-vote", nowPlaying.submissionId, vote);
    setVotedSubmissionIds((prev) => new Set(prev).add(nowPlaying.submissionId));
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
          onSubmit={handleSongSubmit}
        />
      );
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
      <RoundMusic playing={musicOn && Boolean(roundData) && !roundLeaderboard && !finalLeaderboard} />
      {lobbyCode && <LeaveButton onLeave={handleLeaveLobby} />}
      {memePickData && (
        <PickerIndicator pickerName={memePickData.pickerName} isMe={memePickData.pickerId === myPlayerId} />
      )}
      {screen}
      <p style={{ position: "fixed", bottom: 4, left: 8, fontSize: "0.7rem", opacity: 0.5 }}>
        Musik: "Arcadia" von Kevin MacLeod (incompetech.com), lizenziert unter CC BY 4.0
      </p>
      <HudScaleSlider value={hudScale} onChange={setHudScale} />
    </>
  );
}

export default App;
