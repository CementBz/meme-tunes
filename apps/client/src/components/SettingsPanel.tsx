import type { LobbySettings, NumericSettingKey } from "@meme-tunes/shared";
import { SETTINGS_BOUNDS } from "@meme-tunes/shared";

interface SettingsPanelProps {
  settings: LobbySettings;
  isHost: boolean;
  onUpdate: (settings: Partial<LobbySettings>) => void;
}

const FIELDS: { key: NumericSettingKey; label: string; unit: string }[] = [
  { key: "totalRounds", label: "Rundenanzahl", unit: "Runden" },
  { key: "memePickSeconds", label: "Zeit für Meme-Auswahl", unit: "s" },
  { key: "submitSeconds", label: "Zeit für Songauswahl", unit: "s" },
  { key: "playbackSeconds", label: "Dauer pro Song bei Wiedergabe", unit: "s" },
];

export function SettingsPanel({ settings, isHost, onUpdate }: SettingsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
      {FIELDS.map(({ key, label, unit }) => {
        const bounds = SETTINGS_BOUNDS[key];
        return (
          <label
            key={key}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", color: "#ffffff" }}
          >
            {label}: {settings[key]} {unit}
            <input
              type="range"
              className="white-slider"
              min={bounds.min}
              max={bounds.max}
              step={1}
              value={settings[key]}
              disabled={!isHost}
              onChange={(e) => onUpdate({ [key]: Number(e.target.value) })}
              style={{ width: "260px" }}
            />
          </label>
        );
      })}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#ffffff" }}>
        Song-Abstimmung:
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ anonymousVoting: true })}
          style={{ background: settings.anonymousVoting ? "var(--accent)" : "var(--border)" }}
        >
          Anonym
        </button>
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ anonymousVoting: false })}
          style={{ background: !settings.anonymousVoting ? "var(--accent)" : "var(--border)" }}
        >
          Namentlich
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#ffffff" }}>
        Meme-Quelle:
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ memeSource: "giphy" })}
          style={{ background: settings.memeSource === "giphy" ? "var(--accent)" : "var(--border)" }}
        >
          Giphy Bilder
        </button>
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ memeSource: "local" })}
          style={{ background: settings.memeSource === "local" ? "var(--accent)" : "var(--border)" }}
        >
          Bessere
        </button>
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ memeSource: "uploads" })}
          style={{ background: settings.memeSource === "uploads" ? "var(--accent)" : "var(--border)" }}
        >
          Eigene Bilder
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#ffffff" }}>
        Song-Vorschläge (nur bei Giphy Bilder):
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ songHints: true })}
          style={{ background: settings.songHints ? "var(--accent)" : "var(--border)" }}
        >
          An
        </button>
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdate({ songHints: false })}
          style={{ background: !settings.songHints ? "var(--accent)" : "var(--border)" }}
        >
          Aus
        </button>
      </div>

      {!isHost && <p style={{ fontSize: "0.8rem", color: "#ffffff" }}>Nur der Host kann die Einstellungen ändern.</p>}
    </div>
  );
}
