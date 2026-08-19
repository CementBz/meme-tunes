import { useEffect } from "react";
import type { LeaderboardEntry, RoundSubmissionSummary } from "@meme-tunes/shared";
import { socket } from "../socket";
import { MemeMedia } from "./MemeMedia";

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  roundNumber: number;
  roundSubmissions: RoundSubmissionSummary[];
  isHost: boolean;
  onForceSkip: () => void;
}

export function LeaderboardView({ entries, roundNumber, roundSubmissions, isHost, onForceSkip }: LeaderboardViewProps) {
  useEffect(() => {
    // Lets the server hold the 20s display timer until everyone's rendered
    // this (potentially image-heavy) gallery instead of starting it blind.
    socket.emit("phase-ready");
  }, [roundNumber]);

  return (
    <section id="center">
      <div className="hud-scale-content" style={{ maxWidth: "90vw" }}>
        <h1 style={{ fontSize: "3rem" }}>Rangliste nach Runde {roundNumber}</h1>
        <table className="leaderboard-table" style={{ fontSize: "1.3rem", margin: "0 auto" }}>
          <thead>
            <tr>
              <th>Platz</th>
              <th>Name</th>
              <th>Punkte</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.playerId}>
                <td>{index + 1}</td>
                <td>{entry.name}</td>
                <td>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {roundSubmissions.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              overflowX: "auto",
              padding: "0.5rem",
              maxWidth: "90vw",
              justifyContent: roundSubmissions.length <= 4 ? "center" : "flex-start",
            }}
          >
            {roundSubmissions.map((s) => (
              <div key={s.playerId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <strong style={{ fontSize: "0.9rem" }}>{s.playerName}</strong>
                <MemeMedia
                  url={s.memeUrl}
                  alt={`Meme von ${s.playerName}`}
                  style={{ width: "160px", height: "160px", objectFit: "cover", border: "2px solid var(--border)" }}
                />
                <span style={{ fontSize: "0.75rem", opacity: 0.8, maxWidth: "160px", textAlign: "center" }}>{s.songTitle}</span>
              </div>
            ))}
          </div>
        )}

        {isHost ? (
          <button type="button" onClick={onForceSkip}>
            Weiter ⏭
          </button>
        ) : (
          <p>Nächste Runde startet gleich…</p>
        )}
      </div>
    </section>
  );
}
