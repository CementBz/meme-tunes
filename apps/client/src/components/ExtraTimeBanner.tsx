import { useEffect, useState } from "react";
import { PIXEL_FONT } from "../pixelFont";

interface ExtraTimeBannerProps {
  voteDeadlineTs: number;
  yesVotes: number;
  eligibleVoters: number;
  canVote: boolean;
  hasVoted: boolean;
  onVote: () => void;
}

export function ExtraTimeBanner({
  voteDeadlineTs,
  yesVotes,
  eligibleVoters,
  canVote,
  hasVoted,
  onVote,
}: ExtraTimeBannerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((voteDeadlineTs - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((voteDeadlineTs - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [voteDeadlineTs]);

  return (
    <div
      className="pill-badge"
      style={{
        position: "fixed",
        bottom: "70px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(20, 20, 30, 0.85)",
        color: "#ffffff",
        zIndex: 950,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        padding: "10px 20px",
        textAlign: "center",
        whiteSpace: "nowrap",
        ...PIXEL_FONT,
        fontSize: "0.6rem",
      }}
    >
      <span>
        ⏱️ Mehr Zeit angefordert — {yesVotes}/{eligibleVoters} dafür ({remainingSeconds}s)
      </span>
      {canVote && !hasVoted && (
        <button
          type="button"
          onClick={onVote}
          className="btn-success"
          style={{ ...PIXEL_FONT, fontSize: "0.55rem", padding: "6px 14px" }}
        >
          Ja, mehr Zeit geben
        </button>
      )}
      {canVote && hasVoted && <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>Stimme abgegeben ✓</span>}
    </div>
  );
}
