import { useState } from "react";
import type { LobbySettings, Player } from "@meme-tunes/shared";
import { MIN_PLAYERS } from "@meme-tunes/shared";
import { ConfirmDialog } from "./ConfirmDialog";
import { DrawableBackground } from "./DrawableBackground";
import { PhotoCollageBackground } from "./PhotoCollageBackground";
import { SettingsPanel } from "./SettingsPanel";
import { playSfx } from "../sfx";

interface LobbyRoomProps {
  code: string;
  players: Player[];
  myPlayerId: string;
  settings: LobbySettings;
  onStart: () => void;
  onUpdateSettings: (settings: Partial<LobbySettings>) => void;
  error: string | null;
}

export function LobbyRoom({
  code,
  players,
  myPlayerId,
  settings,
  onStart,
  onUpdateSettings,
  error,
}: LobbyRoomProps) {
  const isHost = players.find((p) => p.id === myPlayerId)?.isHost ?? false;
  const canStart = players.length >= MIN_PLAYERS;
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  const handleCopyCode = () => {
    playSfx("/copy-code.wav");
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStart = () => {
    setShowStartConfirm(false);
    playSfx("/start-game.wav", 0.5);
    onStart();
  };

  return (
    <section id="center">
      <PhotoCollageBackground blurred={showSettings} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          filter: showSettings ? "blur(8px)" : "none",
          transition: "filter 0.25s ease",
          zIndex: -1,
        }}
      >
        <DrawableBackground />
      </div>

      <div className="hud-scale-content" style={{ marginTop: "16vh" }}>
        <button
          type="button"
          onClick={handleCopyCode}
          style={{
            background: "#D16666",
            color: "#1a0505",
            fontFamily: "var(--mono)",
            fontSize: "1.75rem",
            letterSpacing: "0.15em",
            padding: "12px 24px",
          }}
        >
          {code} {copied ? "✓" : "📋"}
        </button>

        <p>{copied ? "In die Zwischenablage kopiert!" : "↑ Copy Link ↑"}</p>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {players.map((p) => (
            <li key={p.id}>
              {p.name}
              {p.isHost && " 👑"}
              {p.id === myPlayerId && " (du)"}
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => setShowSettings((v) => !v)}>
          {showSettings ? "Einstellungen ausblenden" : "⚙ Einstellungen"}
        </button>

        {showSettings && <SettingsPanel settings={settings} isHost={isHost} onUpdate={onUpdateSettings} />}

        {isHost ? (
          <>
            <button type="button" onClick={() => setShowStartConfirm(true)} disabled={!canStart}>
              Spiel starten
            </button>
            {!canStart && <p>Mindestens {MIN_PLAYERS} Spieler nötig.</p>}
          </>
        ) : (
          <p>Warte auf den Host, um das Spiel zu starten…</p>
        )}

        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </div>

      {showStartConfirm && (
        <ConfirmDialog
          message="Möchtest du die Runde wirklich starten?"
          onConfirm={handleStart}
          onCancel={() => setShowStartConfirm(false)}
        />
      )}
    </section>
  );
}
