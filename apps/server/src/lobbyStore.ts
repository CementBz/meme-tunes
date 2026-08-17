import type { LobbyPhase, LobbySettings, Player, Submission } from "@meme-tunes/shared";
import { DEFAULT_SETTINGS } from "@meme-tunes/shared";
import type { PausableTimer } from "./pausableTimer.js";

export interface Lobby {
  code: string;
  players: Map<string, Player>;
  hostId: string;
  phase: LobbyPhase;
  settings: LobbySettings;
  currentRoundNumber: number;
  usedMemeUrls: Set<string>;
  currentMemeUrl: string | null;
  currentMemeOptions: string[];
  currentPickerId: string | null;
  pickDeadlineTs: number | null;
  currentSubmissions: Submission[];
  submitDeadlineTs: number | null;
  currentVotingSubmissionId: string | null;
  activeTimer: PausableTimer | null;
  paused: boolean;
  uploadsByPlayer: Map<string, string[]>;
  uploadDeadlineTs: number | null;
  communityVoteOptions: string[];
  communityVotes: Map<string, number>;
  voteDeadlineTs: number | null;
}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L to avoid ambiguity
const lobbies = new Map<string, Lobby>();
const socketToLobby = new Map<string, string>();

function generateCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  } while (lobbies.has(code));
  return code;
}

export function createLobby(hostSocketId: string, hostName: string): Lobby {
  const code = generateCode();
  const host: Player = { id: hostSocketId, name: hostName, isHost: true, connected: true, score: 0 };
  const lobby: Lobby = {
    code,
    players: new Map([[hostSocketId, host]]),
    hostId: hostSocketId,
    phase: "waiting",
    settings: { ...DEFAULT_SETTINGS },
    currentRoundNumber: 0,
    usedMemeUrls: new Set(),
    currentMemeUrl: null,
    currentMemeOptions: [],
    currentPickerId: null,
    pickDeadlineTs: null,
    currentSubmissions: [],
    submitDeadlineTs: null,
    currentVotingSubmissionId: null,
    activeTimer: null,
    paused: false,
    uploadsByPlayer: new Map(),
    uploadDeadlineTs: null,
    communityVoteOptions: [],
    communityVotes: new Map(),
    voteDeadlineTs: null,
  };
  lobbies.set(code, lobby);
  socketToLobby.set(hostSocketId, code);
  return lobby;
}

export function joinLobby(code: string, socketId: string, name: string): Lobby | { error: string } {
  const lobby = lobbies.get(code.toUpperCase());
  if (!lobby) return { error: "Lobby nicht gefunden." };
  if (lobby.phase !== "waiting") return { error: "Das Spiel läuft bereits." };
  const player: Player = { id: socketId, name, isHost: false, connected: true, score: 0 };
  lobby.players.set(socketId, player);
  socketToLobby.set(socketId, lobby.code);
  return lobby;
}

export function getLobbyBySocket(socketId: string): Lobby | undefined {
  const code = socketToLobby.get(socketId);
  return code ? lobbies.get(code) : undefined;
}

export function getLobby(code: string): Lobby | undefined {
  return lobbies.get(code);
}

export function removePlayer(socketId: string): Lobby | undefined {
  const lobby = getLobbyBySocket(socketId);
  if (!lobby) return undefined;

  if (lobby.phase !== "waiting") {
    const player = lobby.players.get(socketId);
    if (player) player.connected = false;
    return lobby;
  }

  lobby.players.delete(socketId);
  socketToLobby.delete(socketId);

  if (lobby.players.size === 0) {
    lobbies.delete(lobby.code);
    return undefined;
  }

  if (lobby.hostId === socketId) {
    const nextHost = lobby.players.values().next().value as Player;
    nextHost.isHost = true;
    lobby.hostId = nextHost.id;
  }

  return lobby;
}

export function publicPlayers(lobby: Lobby): Player[] {
  return Array.from(lobby.players.values());
}

export function connectedPlayers(lobby: Lobby): Player[] {
  return publicPlayers(lobby).filter((p) => p.connected);
}
