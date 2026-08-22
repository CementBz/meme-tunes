import type { LeaderboardEntry } from "@meme-tunes/shared";
import { PIXEL_FONT } from "../pixelFont";

interface GameOverViewProps {
  entries: LeaderboardEntry[];
}

export function GameOverView({ entries }: GameOverViewProps) {
  return (
    <section id="center">
      <div className="hud-scale-content">
        <h1 style={{ ...PIXEL_FONT, fontSize: "1.6rem", lineHeight: 1.8 }}>Spiel beendet! 🎉</h1>
        <table className="leaderboard-table" style={{ ...PIXEL_FONT, fontSize: "0.65rem" }}>
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
                <td>
                  {index + 1} {index === 0 && "🏆"}
                </td>
                <td>{entry.name}</td>
                <td>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
