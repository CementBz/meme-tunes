import type { LeaderboardEntry } from "@meme-tunes/shared";

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  roundNumber: number;
}

export function LeaderboardView({ entries, roundNumber }: LeaderboardViewProps) {
  return (
    <section id="center">
      <div className="hud-scale-content">
        <h1>Rangliste nach Runde {roundNumber}</h1>
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
                <td>{index + 1}</td>
                <td>{entry.name}</td>
                <td>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Nächste Runde startet gleich…</p>
      </div>
    </section>
  );
}
