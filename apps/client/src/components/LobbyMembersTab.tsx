import { useRef, useState } from "react";
import type { Player } from "@meme-tunes/shared";
import { MIN_PLAYERS } from "@meme-tunes/shared";
import { socket } from "../socket";
import { playSfx } from "../sfx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

function resolveAvatarUrl(url: string): string {
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
}

interface LobbyMembersTabProps {
  code: string;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onStartClick: () => void;
  error: string | null;
}

export function LobbyMembersTab({ code, players, myPlayerId, isHost, onStartClick, error }: LobbyMembersTabProps) {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canStart = players.length >= MIN_PLAYERS;

  const handleCopyCode = () => {
    playSfx("/copy-code.wav");
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${SERVER_URL}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) socket.emit("update-avatar", data.url);
    } catch {
      // silently ignore — avatar is cosmetic, not worth blocking the lobby over
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="browser-tab-content">
      <button
        type="button"
        onClick={handleCopyCode}
        className="apple-pill"
        style={{ alignSelf: "flex-start", fontFamily: "var(--mono)", fontSize: "1.3rem", letterSpacing: "0.1em" }}
      >
        {code} {copied ? "✓" : "📋"}
      </button>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {players.map((p) => (
          <li key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {p.avatarUrl ? (
              <img
                src={resolveAvatarUrl(p.avatarUrl)}
                alt=""
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#ccc", display: "inline-block" }} />
            )}
            <span>
              {p.name}
              {p.isHost && " 👑"}
              {p.id === myPlayerId && " (du)"}
            </span>
            {p.id === myPlayerId && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                  style={{ display: "none" }}
                  id="avatar-upload-input"
                />
                <label htmlFor="avatar-upload-input" style={{ fontSize: "0.7rem", cursor: "pointer", textDecoration: "underline" }}>
                  {uploading ? "lädt…" : "Bild ändern"}
                </label>
              </>
            )}
          </li>
        ))}
      </ul>

      {isHost ? (
        <>
          <button
            type="button"
            onClick={onStartClick}
            disabled={!canStart}
            className="apple-pill"
            style={{ alignSelf: "flex-start", background: canStart ? "#0071e3" : undefined, color: canStart ? "#fff" : undefined }}
          >
            Spiel starten
          </button>
          {!canStart && <p style={{ fontSize: "0.8rem", margin: 0 }}>Mindestens {MIN_PLAYERS} Spieler nötig.</p>}
        </>
      ) : (
        <p style={{ margin: 0 }}>Warte auf den Host, um das Spiel zu starten…</p>
      )}

      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
    </div>
  );
}
