interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "2px solid var(--accent)",
          padding: "24px 32px",
          maxWidth: "320px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <p style={{ color: "#ffffff", margin: 0 }}>{message}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button type="button" className="btn-success" onClick={onConfirm}>
            Ja
          </button>
          <button type="button" onClick={onCancel} style={{ background: "#D16666", color: "#1a0505" }}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
