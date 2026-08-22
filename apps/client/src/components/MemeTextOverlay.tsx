import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PIXEL_FONT } from "../pixelFont";

interface MemeTextOverlayProps {
  text: string;
  onTextChange?: (t: string) => void;
  position: "top" | "bottom";
  onPositionChange?: (p: "top" | "bottom") => void;
  readOnly?: boolean;
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

const MAX_FONT_PX = 56;
const MIN_FONT_PX = 9;
const FONT_STEP_PX = 1;

export function MemeTextOverlay({ text, onTextChange, position, onPositionChange, readOnly = false }: MemeTextOverlayProps) {
  const [editing, setEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement & HTMLInputElement>(null!);
  const [fontSize, setFontSize] = useState(MAX_FONT_PX);

  // Shrinks the text until it actually fits within its third (top or
  // bottom) of the meme image, instead of guessing from character count —
  // re-measured whenever the text, layout, or the image itself (once it
  // finishes loading) changes size.
  useEffect(() => {
    const container = containerRef.current;
    const parent = container?.parentElement;
    if (!container || !parent) return;

    const fit = () => {
      const textEl = textRef.current;
      if (!textEl) return;
      const maxHeight = parent.clientHeight / 3;
      const maxWidth = parent.clientWidth * 0.92;
      if (maxHeight <= 0 || maxWidth <= 0) return;

      let size = MAX_FONT_PX;
      textEl.style.fontSize = `${size}px`;
      while (size > MIN_FONT_PX && (textEl.scrollHeight > maxHeight || textEl.scrollWidth > maxWidth)) {
        size -= FONT_STEP_PX;
        textEl.style.fontSize = `${size}px`;
      }
      setFontSize(size);
    };

    fit();
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [text, position, editing]);

  if (readOnly && !text) return null;

  return (
    <div
      ref={containerRef}
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
      {editing && onTextChange ? (
        <input
          ref={textRef}
          type="text"
          autoFocus
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          style={{
            ...TEXT_STYLE,
            fontSize: `${fontSize}px`,
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
          ref={textRef}
          onClick={readOnly ? undefined : () => setEditing(true)}
          style={{
            ...TEXT_STYLE,
            fontSize: `${fontSize}px`,
            opacity: text ? 1 : 0.55,
            cursor: readOnly ? "default" : "text",
            textAlign: "center",
            maxHeight: "34%",
            overflow: "hidden",
          }}
        >
          {text || (readOnly ? "" : "Text (optional)")}
        </div>
      )}

      {!readOnly && onPositionChange && (
        <button
          type="button"
          onClick={() => onPositionChange(position === "top" ? "bottom" : "top")}
          title="Position wechseln"
          style={{ ...PIXEL_FONT, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.5rem", padding: "4px 10px", boxShadow: "none" }}
        >
          {position === "top" ? "⬇️ Nach unten" : "⬆️ Nach oben"}
        </button>
      )}
    </div>
  );
}
