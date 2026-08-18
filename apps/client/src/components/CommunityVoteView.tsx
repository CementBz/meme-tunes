import { useEffect, useState } from "react";
import { MemeMedia } from "./MemeMedia";

interface CommunityVoteViewProps {
  roundNumber: number;
  totalRounds: number;
  options: string[];
  voteDeadlineTs: number;
  paused: boolean;
  onVote: (index: number) => void;
}

export function CommunityVoteView({
  roundNumber,
  totalRounds,
  options,
  voteDeadlineTs,
  paused,
  onVote,
}: CommunityVoteViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((voteDeadlineTs - Date.now()) / 1000))
  );
  const [votedIndex, setVotedIndex] = useState<number | null>(null);

  useEffect(() => {
    setVotedIndex(null);
  }, [options]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((voteDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [voteDeadlineTs, paused]);

  const handleVote = (index: number) => {
    if (votedIndex !== null) return;
    setVotedIndex(index);
    onVote(index);
  };

  return (
    <section id="center">
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/bg-round.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -2,
        }}
      />
      <div className="hud-scale-content">
        <h1>
          Runde {roundNumber} / {totalRounds} — welches Bild?
        </h1>
        <p>Verbleibende Zeit: {remainingSeconds}s</p>
        {paused && <p>⏸ Pausiert</p>}
        {votedIndex !== null && <p>Danke für deine Stimme! Warte auf die anderen…</p>}

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {options.map((url, index) => (
            <button
              key={url + index}
              type="button"
              onClick={() => handleVote(index)}
              disabled={votedIndex !== null}
              className="meme-option"
            >
              <MemeMedia
                url={url}
                alt={`Bild-Option ${index + 1}`}
                style={{
                  display: "block",
                  maxWidth: "28vw",
                  maxHeight: "40vh",
                  border: `3px solid ${votedIndex === index ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 0,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
