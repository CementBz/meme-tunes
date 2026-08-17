import { useEffect, useState } from "react";
import type { YoutubeSearchResult } from "@meme-tunes/shared";
import type { SongSubmission } from "../types";
import { MemeMedia } from "./MemeMedia";
import { SongPicker } from "./SongPicker";

interface RoundViewProps {
  roundNumber: number;
  totalRounds: number;
  memeUrl: string;
  submitDeadlineTs: number;
  submissionsClosed: boolean;
  hasSubmitted: boolean;
  paused: boolean;
  songHints: YoutubeSearchResult[];
  onSubmit: (data: SongSubmission) => void;
}

export function RoundView({
  roundNumber,
  totalRounds,
  memeUrl,
  submitDeadlineTs,
  submissionsClosed,
  hasSubmitted,
  paused,
  songHints,
  onSubmit,
}: RoundViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((submitDeadlineTs - Date.now()) / 1000))
  );

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((submitDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [submitDeadlineTs, paused]);

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
          Runde {roundNumber} / {totalRounds}
        </h1>
        <MemeMedia url={memeUrl} alt="Meme der Runde" style={{ maxWidth: "55vw", maxHeight: "50vh" }} />

        {!submissionsClosed && <p>Verbleibende Zeit: {remainingSeconds}s</p>}
        {paused && <p>⏸ Pausiert</p>}

        {submissionsClosed ? (
          <p>Einreichungen geschlossen – Wiedergabe folgt.</p>
        ) : hasSubmitted ? (
          <p>Song eingereicht ✅ Warte auf die anderen Spieler…</p>
        ) : (
          <SongPicker songHints={songHints} onSubmit={onSubmit} />
        )}
      </div>
    </section>
  );
}
