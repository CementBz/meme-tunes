interface PersonalSettingsTabProps {
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  hudScale: number;
  onHudScaleChange: (v: number) => void;
}

export function PersonalSettingsTab({
  musicVolume,
  onMusicVolumeChange,
  hudScale,
  onHudScaleChange,
}: PersonalSettingsTabProps) {
  return (
    <div className="browser-tab-content">
      <h2 style={{ margin: 0, color: "#1a1a1a" }}>Persönliche Einstellungen</h2>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        Musik-Lautstärke: {Math.round(musicVolume * 100)}%
        <input
          type="range"
          className="browser-slider"
          min={0}
          max={1}
          step={0.01}
          value={musicVolume}
          onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        HUD-Größe: {Math.round(hudScale * 100)}%
        <input
          type="range"
          className="browser-slider"
          min={1}
          max={1.5}
          step={0.01}
          value={hudScale}
          onChange={(e) => onHudScaleChange(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
