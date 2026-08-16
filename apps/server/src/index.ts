import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, LobbySettings, NumericSettingKey, ServerToClientEvents } from "@meme-tunes/shared";
import { GAME_START_COUNTDOWN_SECONDS, GAME_START_SILENCE_SECONDS, MIN_PLAYERS, SETTINGS_BOUNDS } from "@meme-tunes/shared";

const NUMERIC_SETTING_KEYS: NumericSettingKey[] = [
  "totalRounds",
  "submitSeconds",
  "memePickSeconds",
  "playbackSeconds",
];
import { createLobby, joinLobby, removePlayer, publicPlayers, getLobbyBySocket, connectedPlayers } from "./lobbyStore.js";
import { searchYoutube } from "./youtube.js";
import { startGame, tryCloseSubmissionsEarly, submitMemePick, rerollMemeOptions } from "./gameEngine.js";
import { registerUploadRoute } from "./upload.js";

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true }));
registerUploadRoute(app);

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

function clampSettings(update: Partial<LobbySettings>): Partial<LobbySettings> {
  const clamped: Partial<LobbySettings> = {};

  for (const key of NUMERIC_SETTING_KEYS) {
    const value = update[key];
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    const bounds = SETTINGS_BOUNDS[key];
    clamped[key] = Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
  }

  if (typeof update.anonymousVoting === "boolean") {
    clamped.anonymousVoting = update.anonymousVoting;
  }

  return clamped;
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("create-lobby", (name, ack) => {
    const lobby = createLobby(socket.id, name.trim().slice(0, 24));
    socket.join(lobby.code);
    ack({ code: lobby.code, playerId: socket.id });
    io.to(lobby.code).emit("lobby-updated", publicPlayers(lobby));
    io.to(lobby.code).emit("settings-updated", lobby.settings);
  });

  socket.on("join-lobby", (code, name, ack) => {
    const result = joinLobby(code, socket.id, name.trim().slice(0, 24));
    if ("error" in result) {
      ack({ ok: false, error: result.error });
      return;
    }
    socket.join(result.code);
    ack({ ok: true, playerId: socket.id });
    io.to(result.code).emit("lobby-updated", publicPlayers(result));
    io.to(result.code).emit("settings-updated", result.settings);
  });

  socket.on("update-settings", (update) => {
    const lobby = getLobbyBySocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== "waiting") return;

    Object.assign(lobby.settings, clampSettings(update));
    io.to(lobby.code).emit("settings-updated", lobby.settings);
  });

  socket.on("start-game", () => {
    const lobby = getLobbyBySocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== "waiting") return;

    if (connectedPlayers(lobby).length < MIN_PLAYERS) {
      socket.emit("error-message", `Mindestens ${MIN_PLAYERS} Spieler nötig, um zu starten.`);
      return;
    }

    io.to(lobby.code).emit("game-starting");
    setTimeout(() => {
      startGame(io, lobby).catch((err) => {
        console.error("Failed to start game:", err);
        socket.emit("error-message", "Die Runde konnte nicht gestartet werden.");
      });
    }, (GAME_START_COUNTDOWN_SECONDS + GAME_START_SILENCE_SECONDS) * 1000);
  });

  socket.on("submit-meme-pick", (memeIndex) => {
    const lobby = getLobbyBySocket(socket.id);
    if (!lobby) return;
    submitMemePick(io, lobby, socket.id, memeIndex);
  });

  socket.on("reroll-memes", () => {
    const lobby = getLobbyBySocket(socket.id);
    if (!lobby) return;
    rerollMemeOptions(io, lobby, socket.id);
  });

  socket.on("submit-song", (submission) => {
    const lobby = getLobbyBySocket(socket.id);
    if (!lobby || lobby.phase !== "round_submitting") return;

    const player = lobby.players.get(socket.id);
    if (!player) return;

    const alreadySubmitted = lobby.currentSubmissions.some((s) => s.playerId === socket.id);
    if (alreadySubmitted) return;

    lobby.currentSubmissions.push({
      id: randomUUID(),
      playerId: socket.id,
      playerName: player.name,
      source: submission.source,
      videoId: submission.videoId,
      fileUrl: submission.fileUrl,
      title: submission.title,
      channel: submission.channel,
      thumbnailUrl: submission.thumbnailUrl,
      startSeconds: submission.startSeconds,
      upVotes: [],
      downVotes: [],
    });

    tryCloseSubmissionsEarly(io, lobby);
  });

  socket.on("submit-vote", (submissionId, vote) => {
    const lobby = getLobbyBySocket(socket.id);
    if (!lobby || lobby.phase !== "round_playback") return;
    if (lobby.currentVotingSubmissionId !== submissionId) return;

    const submission = lobby.currentSubmissions.find((s) => s.id === submissionId);
    if (!submission || submission.playerId === socket.id) return;

    const alreadyVoted = submission.upVotes.includes(socket.id) || submission.downVotes.includes(socket.id);
    if (alreadyVoted) return;

    (vote === "up" ? submission.upVotes : submission.downVotes).push(socket.id);
  });

  socket.on("leave-lobby", () => {
    const lobby = removePlayer(socket.id);
    if (lobby) {
      socket.leave(lobby.code);
      io.to(lobby.code).emit("lobby-updated", publicPlayers(lobby));
    }
  });

  socket.on("search-songs", (query, ack) => {
    searchYoutube(query)
      .then((results) => ack(results))
      .catch((err) => {
        console.error("YouTube search failed:", err);
        ack([]);
      });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    const lobby = removePlayer(socket.id);
    if (lobby) {
      io.to(lobby.code).emit("lobby-updated", publicPlayers(lobby));
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
