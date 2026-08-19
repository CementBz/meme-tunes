import type { LobbySettings, NumericSettingKey } from "@meme-tunes/shared";
import { SETTINGS_BOUNDS } from "@meme-tunes/shared";

interface SettingsPanelProps {
  settings: LobbySettings;
  isHost: boolean;
  onUpdate: (settings: Partial<LobbySettings>) => void;
}

const FIELDS: { key: NumericSettingKey; label: string; unit: string }[] = [
  { key: "totalRounds", label: "Rundenanzahl", unit: "Runden" },
  { key: "submitSeconds", label: "Zeit für Songauswahl", unit: "s" },
  { key: "playbackSeconds", label: "Dauer pro Song bei Wiedergabe", unit: "s" },
];

export function SettingsPanel({ settings, isHost, onUpdate }: SettingsPanelProps) {
  return (
    <div className="browser-tab-content" style={{ opacity: isHost ? 1 : 0.55 }}>
      <h2 style={{ margin: 0 }}>Lobby-Einstellungen</h2>

      {FIELDS.map(({ key, label, unit }) => {
        const bounds = SETTINGS_BOUNDS[key];
        return (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {label}: {settings[key]} {unit}
            <input
              type="range"
              className="browser-slider"
              min={bounds.min}
              max={bounds.max}
              step={1}
              value={settings[key]}
              disabled={!isHost}
              onChange={(e) => onUpdate({ [key]: Number(e.target.value) })}
            />
          </label>
        );
      })}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        Song-Abstimmung
        <div style={{ display: "flex", gap: "0.5rem" }}>
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
      </div>

      {!isHost && <p style={{ fontSize: "0.8rem", margin: 0 }}>Nur der Host kann die Einstellungen ändern.</p>}
    </div>
  );
}
