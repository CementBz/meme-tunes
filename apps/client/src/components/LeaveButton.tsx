interface LeaveButtonProps {
  onLeave: () => void;
}

export function LeaveButton({ onLeave }: LeaveButtonProps) {
  const handleClick = () => {
    if (window.confirm("Möchtest du die Lobby wirklich verlassen?")) {
      onLeave();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        background: "none",
        boxShadow: "none",
        color: "#ff3b3b",
        fontWeight: 800,
        zIndex: 1000,
      }}
    >
      Leave
    </button>
  );
}
