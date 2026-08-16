interface HudScaleSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function HudScaleSlider({ value, onChange }: HudScaleSliderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        margin: "24px auto",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "#ffffff" }}>HUD Größe</span>
      <input
        type="range"
        className="white-slider"
        min={1}
        max={1.5}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        title="HUD Größe"
        style={{ width: "220px" }}
      />
    </div>
  );
}
