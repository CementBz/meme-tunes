import type { LeaderboardEntry } from "@meme-tunes/shared";

interface GameOverViewProps {
  entries: LeaderboardEntry[];
}

export function GameOverView({ entries }: GameOverViewProps) {
  return (
    <section id="center">
      <div className="hud-scale-content">
        <h1>Spiel beendet! 🎉</h1>
        <table className="leaderboard-table">
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
