export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  score: number;
}

export type LobbyPhase =
  | "waiting"
  | "round_meme_reveal"
  | "round_submitting"
  | "round_playback"
  | "round_results"
  | "game_over";

export type SongSourceType = "youtube" | "upload";

export interface Submission {
  id: string;
  playerId: string;
  playerName: string;
  source: SongSourceType;
  videoId: string | null;
  fileUrl: string | null;
  title: string;
  channel: string;
  thumbnailUrl: string;
  startSeconds: number;
  upVotes: string[];
  downVotes: string[];
}

export interface RoundSummary {
  roundNumber: number;
  memeUrl: string;
  submissions: Submission[];
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
}

export interface LobbySettings {
  totalRounds: number;
  submitSeconds: number;
  memePickSeconds: number;
  playbackSeconds: number;
  anonymousVoting: boolean;
}

export const DEFAULT_SETTINGS: LobbySettings = {
  totalRounds: 10,
  submitSeconds: 90,
  memePickSeconds: 15,
  playbackSeconds: 10,
  anonymousVoting: true,
};

export type NumericSettingKey = "totalRounds" | "submitSeconds" | "memePickSeconds" | "playbackSeconds";

export const SETTINGS_BOUNDS: Record<NumericSettingKey, { min: number; max: number }> = {
  totalRounds: { min: 3, max: 20 },
  submitSeconds: { min: 30, max: 180 },
  memePickSeconds: { min: 5, max: 60 },
  playbackSeconds: { min: 5, max: 30 },
};

export const PLAYBACK_PAUSE_SECONDS = 3;
export const MIN_PLAYERS = 1;
export const GAME_START_COUNTDOWN_SECONDS = 3;
export const GAME_START_SILENCE_SECONDS = 2;

// Client -> Server events
export interface ClientToServerEvents {
  "create-lobby": (name: string, ack: (res: { code: string; playerId: string }) => void) => void;
  "join-lobby": (
    code: string,
    name: string,
    ack: (res: { ok: true; playerId: string } | { ok: false; error: string }) => void
  ) => void;
  "start-game": () => void;
  "update-settings": (settings: Partial<LobbySettings>) => void;
  "search-songs": (query: string, ack: (res: YoutubeSearchResult[]) => void) => void;
  "submit-meme-pick": (memeIndex: number) => void;
  "reroll-memes": () => void;
  "submit-song": (submission: {
    source: SongSourceType;
    videoId: string | null;
    fileUrl: string | null;
    title: string;
    channel: string;
    thumbnailUrl: string;
    startSeconds: number;
  }) => void;
  "submit-vote": (submissionId: string, vote: "up" | "down") => void;
  "leave-lobby": () => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  "lobby-updated": (players: Player[]) => void;
  "settings-updated": (settings: LobbySettings) => void;
  "game-starting": () => void;
  "meme-pick-started": (data: {
    roundNumber: number;
    memeOptions: string[];
    pickDeadlineTs: number;
    pickerId: string;
    pickerName: string;
  }) => void;
  "round-started": (data: { roundNumber: number; memeUrl: string; submitDeadlineTs: number }) => void;
  "submissions-closed": () => void;
  "now-playing": (data: {
    submissionId: string;
    source: SongSourceType;
    videoId: string | null;
    fileUrl: string | null;
    startSeconds: number;
    playerId: string;
    playerName: string;
    thumbnailUrl: string;
    serverTs: number;
  }) => void;
  "voting-open": (submissionId: string) => void;
  "song-results": (data: {
    submissionId: string;
    upVotes: number;
    downVotes: number;
    upVoterNames?: string[];
    downVoterNames?: string[];
  }) => void;
  "round-leaderboard": (entries: LeaderboardEntry[]) => void;
  "game-over": (finalLeaderboard: LeaderboardEntry[]) => void;
  "error-message": (message: string) => void;
}

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationSeconds: number;
}
