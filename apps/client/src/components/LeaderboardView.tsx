import { useEffect } from "react";
import type { LeaderboardEntry, RoundSubmissionSummary } from "@meme-tunes/shared";
import { socket } from "../socket";
import { MemeMedia } from "./MemeMedia";
import { PhotoCollageBackground } from "./PhotoCollageBackground";
import { PIXEL_FONT } from "../pixelFont";

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
      <PhotoCollageBackground blurred animated={false} />
      <div
        className="hud-scale-content"
        style={{
          maxWidth: "90vw",
          borderStyle: "solid",
          borderWidth: "28px",
          borderImageSource: "url(/dragon-ui/20240707dragon9SlicesB.png)",
          borderImageSlice: "24 fill",
          borderImageWidth: "28px",
          borderImageRepeat: "stretch",
          imageRendering: "pixelated",
          padding: "20px",
        }}
      >
        <h1 style={{ ...PIXEL_FONT, fontSize: "1.6rem", lineHeight: 1.8 }}>Rangliste nach Runde {roundNumber}</h1>
        <table className="leaderboard-table" style={{ ...PIXEL_FONT, fontSize: "0.75rem", margin: "0 auto" }}>
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
                <strong style={{ ...PIXEL_FONT, fontSize: "0.6rem" }}>{s.playerName}</strong>
                <MemeMedia
                  url={s.memeUrl}
                  alt={`Meme von ${s.playerName}`}
                  style={{ width: "160px", height: "160px", objectFit: "cover", border: "2px solid var(--border)" }}
                />
                <span style={{ ...PIXEL_FONT, fontSize: "0.5rem", opacity: 0.8, maxWidth: "160px", textAlign: "center" }}>
                  {s.songTitle}
                </span>
              </div>
            ))}
          </div>
        )}

        {isHost ? (
          <button type="button" onClick={onForceSkip} style={{ ...PIXEL_FONT, fontSize: "0.65rem" }}>
            Weiter ⏭
          </button>
        ) : (
          <p style={{ ...PIXEL_FONT, fontSize: "0.65rem" }}>Nächste Runde startet gleich…</p>
        )}
      </div>
    </section>
  );
}
