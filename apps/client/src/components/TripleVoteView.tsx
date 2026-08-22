import { useEffect, useState } from "react";
import type { TripleVoteOption } from "@meme-tunes/shared";
import { PhotoCollageBackground } from "./PhotoCollageBackground";
import { PIXEL_FONT } from "../pixelFont";

interface TripleVoteViewProps {
  options: TripleVoteOption[];
  voteDeadlineTs: number;
  votedKey: string | null;
  resolvedKey: string | null;
  onVote: (key: string) => void;
}

export function TripleVoteView({ options, voteDeadlineTs, votedKey, resolvedKey, onVote }: TripleVoteViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((voteDeadlineTs - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((voteDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [voteDeadlineTs]);

  return (
    <section id="center">
      <PhotoCollageBackground blurred animated={false} />
      <div className="hud-scale-content">
        <h1 style={{ ...PIXEL_FONT, fontSize: "1.4rem" }}>Stimme ab</h1>
        <p style={{ ...PIXEL_FONT, fontSize: "0.9rem" }}>{remainingSeconds}s</p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {options.map((opt) => {
            const isMine = votedKey === opt.key;
            const isWinner = resolvedKey === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onVote(opt.key)}
                disabled={votedKey !== null || resolvedKey !== null}
                style={{
                  width: "220px",
                  minHeight: "170px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  padding: "20px 16px",
                  borderStyle: "solid",
                  borderWidth: "10px",
                  borderImageSource: "url(/dragon-ui/20240713dragonEmptyFrame.png)",
                  borderImageSlice: "10 fill",
                  borderImageWidth: "10px",
                  borderImageRepeat: "stretch",
                  imageRendering: "pixelated",
                  outline: isWinner ? "3px solid #22c55e" : isMine ? "3px solid #fff" : "3px solid transparent",
                  outlineOffset: "2px",
                }}
              >
                <strong style={{ ...PIXEL_FONT, fontSize: "0.75rem", lineHeight: 1.4 }}>{opt.title}</strong>
                <span style={{ ...PIXEL_FONT, fontSize: "0.55rem", lineHeight: 1.6, fontWeight: 400, opacity: 0.85 }}>
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>

        {resolvedKey && (
          <p style={{ ...PIXEL_FONT, fontSize: "0.75rem" }}>Gewählt: {options.find((o) => o.key === resolvedKey)?.title}</p>
        )}
      </div>
    </section>
  );
}
