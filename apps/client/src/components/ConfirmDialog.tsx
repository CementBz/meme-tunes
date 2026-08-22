import { PIXEL_FONT } from "../pixelFont";

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
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "28px 32px",
          maxWidth: "340px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <p style={{ ...PIXEL_FONT, color: "#1d1d1f", margin: 0, fontSize: "0.7rem", lineHeight: 1.8 }}>{message}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            type="button"
            className="apple-pill"
            style={{ ...PIXEL_FONT, fontSize: "0.6rem", background: "#0071e3", color: "#fff" }}
            onClick={onConfirm}
          >
            Ja
          </button>
          <button
            type="button"
            className="apple-pill"
            style={{ ...PIXEL_FONT, fontSize: "0.6rem", background: "#f2f2f7", color: "#1d1d1f" }}
            onClick={onCancel}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
