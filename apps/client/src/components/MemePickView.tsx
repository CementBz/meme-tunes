import { useEffect, useState } from "react";
import { MemeMedia } from "./MemeMedia";
import { DragonFrameBackground } from "./DragonFrameBackground";

interface MemePickViewProps {
  roundNumber: number;
  totalRounds: number;
  memeOptions: string[];
  pickDeadlineTs: number;
  pickerId: string;
  pickerName: string;
  myPlayerId: string;
  paused: boolean;
  onPick: (index: number) => void;
  onReroll: () => void;
}

export function MemePickView({
  roundNumber,
  totalRounds,
  memeOptions,
  pickDeadlineTs,
  pickerId,
  pickerName,
  myPlayerId,
  paused,
  onPick,
  onReroll,
}: MemePickViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((pickDeadlineTs - Date.now()) / 1000))
  );
  const isPicker = pickerId === myPlayerId;

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((pickDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [pickDeadlineTs, paused]);

  return (
    <section id="center">
      <DragonFrameBackground />
      <div className="hud-scale-content">
        <h1>
          Runde {roundNumber} / {totalRounds} — welches Meme?
        </h1>
        <p>Verbleibende Zeit: {remainingSeconds}s</p>
        {paused && <p>⏸ Pausiert</p>}
        {!isPicker && <p>{pickerName} wählt gerade das Meme für alle…</p>}

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {memeOptions.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => onPick(index)}
              disabled={!isPicker}
              className="meme-option"
            >
              <MemeMedia
                url={url}
                alt={`Meme-Option ${index + 1}`}
                style={{
                  display: "block",
                  maxWidth: "28vw",
                  maxHeight: "40vh",
                  border: `3px solid ${isPicker ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 0,
                }}
              />
            </button>
          ))}
        </div>

        {isPicker && (
          <button type="button" onClick={onReroll} className="pill-badge" style={{ background: "rgba(209, 102, 102, 0.85)", color: "#2b0a0a" }}>
            🔄 Anderes Meme
          </button>
        )}
      </div>
    </section>
  );
}
