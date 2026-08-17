interface PauseButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export function PauseButton({ paused, onToggle }: PauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: "fixed",
        top: "16px",
        left: "16px",
        background: paused ? "#80d39b" : "#D16666",
        color: "#1a0505",
        fontWeight: 700,
        zIndex: 1000,
      }}
    >
      {paused ? "▶ Weiter" : "⏸ Pause"}
    </button>
  );
}
