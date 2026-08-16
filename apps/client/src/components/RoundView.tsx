import { useEffect, useState } from "react";
import type { SongSubmission } from "../types";
import { SongPicker } from "./SongPicker";

interface RoundViewProps {
  roundNumber: number;
  totalRounds: number;
  memeUrl: string;
  submitDeadlineTs: number;
  submissionsClosed: boolean;
  hasSubmitted: boolean;
  onSubmit: (data: SongSubmission) => void;
}

export function RoundView({
  roundNumber,
  totalRounds,
  memeUrl,
  submitDeadlineTs,
  submissionsClosed,
  hasSubmitted,
  onSubmit,
}: RoundViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((submitDeadlineTs - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((submitDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [submitDeadlineTs]);

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
        <img src={memeUrl} alt="Meme der Runde" style={{ maxWidth: "55vw", maxHeight: "50vh" }} />

        {!submissionsClosed && <p>Verbleibende Zeit: {remainingSeconds}s</p>}

        {submissionsClosed ? (
          <p>Einreichungen geschlossen – Wiedergabe folgt.</p>
        ) : hasSubmitted ? (
          <p>Song eingereicht ✅ Warte auf die anderen Spieler…</p>
        ) : (
          <SongPicker onSubmit={onSubmit} />
        )}
      </div>
    </section>
  );
}
