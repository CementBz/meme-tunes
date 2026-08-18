import { useEffect, useState } from "react";
import type { YoutubeSearchResult } from "@meme-tunes/shared";
import { EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS } from "@meme-tunes/shared";
import type { SongSubmission } from "../types";
import { MemeMedia } from "./MemeMedia";
import { SongPicker } from "./SongPicker";
import { ExtraTimeBanner } from "./ExtraTimeBanner";

interface ExtraTimeState {
  voteDeadlineTs: number;
  yesVotes: number;
  eligibleVoters: number;
}

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
  extraTimeState: ExtraTimeState | null;
  extraTimeResult: boolean | null;
  hasRequestedExtraTime: boolean;
  hasVotedExtraTime: boolean;
  onRequestExtraTime: () => void;
  onVoteExtraTime: () => void;
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
  extraTimeState,
  extraTimeResult,
  hasRequestedExtraTime,
  hasVotedExtraTime,
  onRequestExtraTime,
  onVoteExtraTime,
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

  const canRequestExtraTime =
    !hasSubmitted &&
    !hasRequestedExtraTime &&
    !submissionsClosed &&
    remainingSeconds > 0 &&
    remainingSeconds <= EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS;

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

        {canRequestExtraTime && (
          <button type="button" onClick={onRequestExtraTime} className="pill-badge" style={{ background: "rgba(209, 102, 102, 0.85)", color: "#2b0a0a" }}>
            ⏱️ +20 Sekunden anfordern
          </button>
        )}

        {extraTimeResult !== null && (
          <p style={{ fontSize: "0.9rem" }}>
            {extraTimeResult ? "✅ Mehrheit dafür — 20 Sekunden extra!" : "❌ Keine Mehrheit — keine Extra-Zeit."}
          </p>
        )}

        {submissionsClosed ? (
          <p>Einreichungen geschlossen – Wiedergabe folgt.</p>
        ) : hasSubmitted ? (
          <p>Song eingereicht ✅ Warte auf die anderen Spieler…</p>
        ) : (
          <SongPicker songHints={songHints} onSubmit={onSubmit} />
        )}
      </div>

      {extraTimeState && (
        <ExtraTimeBanner
          voteDeadlineTs={extraTimeState.voteDeadlineTs}
          yesVotes={extraTimeState.yesVotes}
          eligibleVoters={extraTimeState.eligibleVoters}
          canVote={hasSubmitted}
          hasVoted={hasVotedExtraTime}
          onVote={onVoteExtraTime}
        />
      )}
    </section>
  );
}
