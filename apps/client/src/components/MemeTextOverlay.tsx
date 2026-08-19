import { useState, type CSSProperties } from "react";

interface MemeTextOverlayProps {
  text: string;
  onTextChange: (t: string) => void;
  position: "top" | "bottom";
  onPositionChange: (p: "top" | "bottom") => void;
}

const TEXT_STYLE: CSSProperties = {
  fontFamily: "Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif",
  fontWeight: 900,
  textTransform: "uppercase",
  color: "#ffffff",
  textShadow:
    "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000",
  lineHeight: 1.1,
  letterSpacing: "0.02em",
  wordBreak: "break-word",
};

// Longer text shrinks instead of just wrapping/centering, so it stays within
// its third (top or bottom) of the meme image instead of growing past it.
function fontSizeForText(text: string): string {
  const len = text.length || 1;
  const vw = Math.max(2.2, Math.min(6, 6 - Math.max(0, len - 16) * 0.13));
  return `clamp(0.8rem, ${vw}vw, 2.5rem)`;
}

export function MemeTextOverlay({ text, onTextChange, position, onPositionChange }: MemeTextOverlayProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        left: "4%",
        right: "4%",
        [position]: "3%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        zIndex: 5,
      }}
    >
      {editing ? (
        <input
          type="text"
          autoFocus
          value={text}
          onChange={(e) => onTextChange(e.target.value.slice(0, 60))}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          style={{
            ...TEXT_STYLE,
            fontSize: fontSizeForText(text),
            background: "rgba(0,0,0,0.35)",
            border: "none",
            textAlign: "center",
            width: "100%",
            padding: "4px 8px",
            boxShadow: "none",
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            ...TEXT_STYLE,
            fontSize: fontSizeForText(text),
            opacity: text ? 1 : 0.55,
            cursor: "text",
            textAlign: "center",
            maxHeight: "32%",
            overflow: "hidden",
          }}
        >
          {text || "Text (optional)"}
        </div>
      )}

      <button
        type="button"
        onClick={() => onPositionChange(position === "top" ? "bottom" : "top")}
        title="Position wechseln"
        style={{ background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.7rem", padding: "4px 10px", boxShadow: "none" }}
      >
        {position === "top" ? "⬇️ Nach unten" : "⬆️ Nach oben"}
      </button>
    </div>
  );
}
