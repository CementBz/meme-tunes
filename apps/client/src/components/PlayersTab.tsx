import type { Player } from "@meme-tunes/shared";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

function resolveAvatarUrl(url: string): string {
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
}

interface PlayersTabProps {
  players: Player[];
  submittedPlayerIds: Set<string>;
}

export function PlayersTab({ players, submittedPlayerIds }: PlayersTabProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="browser-tab-content">
      <h2 style={{ margin: 0 }}>Spieler</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {sorted.map((p) => (
          <li key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {p.avatarUrl ? (
              <img
                src={resolveAvatarUrl(p.avatarUrl)}
                alt=""
                style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#ccc", display: "inline-block" }} />
            )}
            <span style={{ flex: 1 }}>
              {p.name}
              {p.isHost && " 👑"}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.score} Pkt.</span>
            <span title={submittedPlayerIds.has(p.id) ? "Song abgegeben" : "Noch am Wählen"}>
              {submittedPlayerIds.has(p.id) ? "✅" : "⏳"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
