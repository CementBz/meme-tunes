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

      {!isHost && <p style={{ fontSize: "0.8rem", color: "#ffffff" }}>Nur der Host kann die Einstellungen ändern.</p>}
    </div>
  );
}
