export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  score: number;
  avatarUrl: string | null;
}

export type LobbyPhase =
  | "waiting"
  | "collecting_uploads"
  | "vote_meme_source"
  | "vote_meme_text"
  | "vote_meme_mode"
  | "own_meme_pick"
  | "round_meme_reveal"
  | "community_vote"
  | "round_submitting"
  | "round_playback"
  | "round_results"
  | "game_over";

export type SongSourceType = "youtube" | "upload" | "itunes" | "deezer";

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
  neutralVotes: string[];
  fireVotes: string[];
  memeUrl: string;
  memeText: string | null;
  memeTextPosition: "top" | "bottom" | null;
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

export interface RoundSubmissionSummary {
  playerId: string;
  playerName: string;
  memeUrl: string;
  songTitle: string;
}

export type MemeSourceType = "giphy" | "local" | "uploads";

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

export interface TripleVoteOption {
  key: string;
  title: string;
  description: string;
}

export type TripleVoteKind = "meme_source" | "meme_text" | "meme_mode";

export type NumericSettingKey = "totalRounds" | "submitSeconds" | "memePickSeconds" | "playbackSeconds";

export const SETTINGS_BOUNDS: Record<NumericSettingKey, { min: number; max: number }> = {
  totalRounds: { min: 3, max: 20 },
  submitSeconds: { min: 30, max: 180 },
  memePickSeconds: { min: 5, max: 60 },
  playbackSeconds: { min: 5, max: 30 },
};

export const FIRE_VOTE_BONUS_POINTS = 3;
export const PLAYBACK_PAUSE_SECONDS = 3;
export const MIN_PLAYERS = 1;
export const GAME_START_COUNTDOWN_SECONDS = 3;
export const GAME_START_SILENCE_SECONDS = 2;
export const UPLOAD_COLLECT_SECONDS = 30;
export const MAX_UPLOADS_PER_PLAYER = 5;
export const COMMUNITY_VOTE_OPTIONS_COUNT = 5;
export const COMMUNITY_VOTE_SECONDS = 15;
export const EXTRA_TIME_SECONDS = 20;
export const EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS = 20;
export const EXTRA_TIME_VOTE_WINDOW_SECONDS = 7;
export const TRIPLE_VOTE_SECONDS = 7;
export const OWN_MEME_PICK_SECONDS = 10;

// Client -> Server events
export interface ClientToServerEvents {
  "create-lobby": (name: string, ack: (res: { code: string; playerId: string }) => void) => void;
  "join-lobby": (
    code: string,
    name: string,
    ack: (res: { ok: true; playerId: string } | { ok: false; error: string }) => void
  ) => void;
  "start-game": () => void;
  "rejoin-lobby": (
    code: string,
    playerId: string,
    ack: (res: { ok: true; playerId: string; snapshot: GameSnapshot } | { ok: false; error: string }) => void
  ) => void;
  "update-settings": (settings: Partial<LobbySettings>) => void;
  "search-songs": (query: string, ack: (res: YoutubeSearchResult[]) => void) => void;
  "search-itunes": (query: string, ack: (res: PreviewSearchResult[]) => void) => void;
  "search-deezer": (query: string, ack: (res: PreviewSearchResult[]) => void) => void;
  "submit-meme-pick": (memeIndex: number) => void;
  "reroll-memes": () => void;
  "submit-triple-vote": (kind: TripleVoteKind, optionKey: string) => void;
  "request-meme-option": (ack: (url: string | null) => void) => void;
  "submit-own-meme": (url: string) => void;
  "submit-song": (submission: {
    source: SongSourceType;
    videoId: string | null;
    fileUrl: string | null;
    title: string;
    channel: string;
    thumbnailUrl: string;
    startSeconds: number;
    memeText: string | null;
    memeTextPosition: "top" | "bottom" | null;
  }) => void;
  "submit-vote": (submissionId: string, vote: "up" | "down" | "meh") => void;
  "submit-fire-vote": (submissionId: string) => void;
  "request-extra-time": () => void;
  "vote-extra-time": () => void;
  "leave-lobby": () => void;
  "update-avatar": (url: string) => void;
  "force-skip-leaderboard": () => void;
  "phase-ready": () => void;
  "pause-game": () => void;
  "resume-game": () => void;
  "submit-meme-upload": (url: string) => void;
  "submit-community-vote": (optionIndex: number) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  "lobby-updated": (players: Player[]) => void;
  "settings-updated": (settings: LobbySettings) => void;
  "game-starting": () => void;
  "uploads-phase-started": (data: { deadlineTs: number }) => void;
  "community-vote-started": (data: { roundNumber: number; options: string[]; voteDeadlineTs: number }) => void;
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
    neutralVotes: number;
    fireVotes: number;
    upVoterNames?: string[];
    downVoterNames?: string[];
    neutralVoterNames?: string[];
    fireVoterNames?: string[];
  }) => void;
  "round-leaderboard": (data: { entries: LeaderboardEntry[]; roundSubmissions: RoundSubmissionSummary[] }) => void;
  "game-over": (finalLeaderboard: LeaderboardEntry[]) => void;
  "error-message": (message: string) => void;
  "song-hints": (data: { roundNumber: number; hints: YoutubeSearchResult[] }) => void;
  "game-paused": () => void;
  "game-resumed": () => void;
  "deadline-updated": (data: {
    pickDeadlineTs?: number;
    submitDeadlineTs?: number;
    voteDeadlineTs?: number;
    uploadDeadlineTs?: number;
  }) => void;
  "extra-time-started": (data: { voteDeadlineTs: number; yesVotes: number; eligibleVoters: number }) => void;
  "extra-time-updated": (data: { yesVotes: number; eligibleVoters: number }) => void;
  "extra-time-resolved": (data: { granted: boolean }) => void;
  "triple-vote-started": (data: { kind: TripleVoteKind; options: TripleVoteOption[]; voteDeadlineTs: number }) => void;
  "triple-vote-resolved": (data: { kind: TripleVoteKind; winningKey: string }) => void;
  "own-meme-pick-started": (data: { deadlineTs: number }) => void;
  "submission-received": (playerId: string) => void;
  "player-joined-feed": (name: string) => void;
  "player-left-feed": (name: string) => void;
}

export interface GameSnapshot {
  phase: LobbyPhase;
  players: Player[];
  settings: LobbySettings;
  paused: boolean;
  currentRoundNumber: number;
  memePickData: {
    roundNumber: number;
    memeOptions: string[];
    pickDeadlineTs: number;
    pickerId: string;
    pickerName: string;
  } | null;
  roundData: { roundNumber: number; memeUrl: string; submitDeadlineTs: number } | null;
  hasSubmitted: boolean;
  submissionsClosed: boolean;
  communityVoteData: { roundNumber: number; options: string[]; voteDeadlineTs: number } | null;
  uploadDeadlineTs: number | null;
  nowPlaying: {
    submissionId: string;
    source: SongSourceType;
    videoId: string | null;
    fileUrl: string | null;
    startSeconds: number;
    playerId: string;
    playerName: string;
    thumbnailUrl: string;
  } | null;
  votedSubmissionIds: string[];
  submittedPlayerIds: string[];
  textOnMemeAllowed: boolean;
  fireVoteUsed: boolean;
  extraTimeState: { voteDeadlineTs: number; yesVotes: number; eligibleVoters: number } | null;
  roundLeaderboard: LeaderboardEntry[] | null;
  roundSubmissions: RoundSubmissionSummary[] | null;
  finalLeaderboard: LeaderboardEntry[] | null;
}

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export interface PreviewSearchResult {
  previewUrl: string;
  title: string;
  artist: string;
  artworkUrl: string;
  durationSeconds: number;
}
