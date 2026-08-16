import { useEffect, useState } from "react";

interface MemePickViewProps {
  roundNumber: number;
  totalRounds: number;
  memeOptions: string[];
  pickDeadlineTs: number;
  pickerId: string;
  pickerName: string;
  myPlayerId: string;
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
  onPick,
  onReroll,
}: MemePickViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((pickDeadlineTs - Date.now()) / 1000))
  );
  const isPicker = pickerId === myPlayerId;

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((pickDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [pickDeadlineTs]);

  return (
    <section id="center">
      <div className="hud-scale-content">
        <h1>
          Runde {roundNumber} / {totalRounds} — welches Meme?
        </h1>
        <p>Verbleibende Zeit: {remainingSeconds}s</p>
        {!isPicker && <p>{pickerName} wählt gerade das Meme für alle…</p>}

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {memeOptions.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => onPick(index)}
              disabled={!isPicker}
              style={{ padding: 0, background: "none", boxShadow: "none" }}
            >
              <img
                src={url}
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
          <button type="button" onClick={onReroll} style={{ background: "#D16666", color: "#1a0505" }}>
            Change Meme
          </button>
        )}
      </div>
    </section>
  );
}
