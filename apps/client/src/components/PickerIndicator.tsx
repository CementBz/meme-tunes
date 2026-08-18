import { useEffect, useState } from "react";

interface PickerIndicatorProps {
  pickerName: string;
  isMe: boolean;
}

const SETTLE_DELAY_MS = 2000;

export function PickerIndicator({ pickerName, isMe }: PickerIndicatorProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), SETTLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="pill-badge"
      style={{
        position: "fixed",
        top: "50%",
        right: "16px",
        transform: settled
          ? "translateY(-50%) translateX(0) scale(1)"
          : "translateY(-50%) translateX(-40vw) scale(1.8)",
        background: "rgba(209, 102, 102, 0.85)",
        color: "#2b0a0a",
        padding: settled ? "10px 18px" : "20px 28px",
        fontWeight: 700,
        fontSize: settled ? "1rem" : "1.75rem",
        maxWidth: settled ? "160px" : "320px",
        textAlign: "center",
        zIndex: 1000,
        transition: "transform 1.1s ease, padding 1.1s ease, font-size 1.1s ease, max-width 1.1s ease",
      }}
    >
      {isMe ? "Du wählst das Meme!" : `${pickerName} wählt das Meme`}
    </div>
  );
}
