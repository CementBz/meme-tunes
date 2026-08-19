import { useEffect, useState } from "react";
import type { TripleVoteOption } from "@meme-tunes/shared";
import { DragonFrameBackground } from "./DragonFrameBackground";

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
      <DragonFrameBackground />
      <div className="hud-scale-content">
        <h1>Stimme ab</h1>
        <p>{remainingSeconds}s</p>

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
                  minHeight: "160px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  padding: "20px 16px",
                  background: isWinner ? "#22c55e" : isMine ? "var(--accent)" : "var(--btn-bg)",
                  border: isMine && !isWinner ? "3px solid #fff" : "3px solid transparent",
                }}
              >
                <strong style={{ fontSize: "1.1rem" }}>{opt.title}</strong>
                <span style={{ fontSize: "0.75rem", fontWeight: 400, opacity: 0.85 }}>{opt.description}</span>
              </button>
            );
          })}
        </div>

        {resolvedKey && <p>Gewählt: {options.find((o) => o.key === resolvedKey)?.title}</p>}
      </div>
    </section>
  );
}
