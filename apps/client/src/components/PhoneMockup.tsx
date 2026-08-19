import { useEffect, useRef, useState } from "react";
import { useDraggable } from "../hooks/useDraggable";

interface FeedItem {
  id: string;
  text: string;
}

interface PhoneMockupProps {
  items: FeedItem[];
  onSendMessage: (text: string) => void;
}

export function PhoneMockup({ items, onSendMessage }: PhoneMockupProps) {
  const [message, setMessage] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const { offset, dragHandleProps } = useDraggable();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [items]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setMessage("");
  };

  return (
    <div
      style={{
        width: "220px",
        height: "min(52vh, 420px)",
        background: "#111",
        borderRadius: "28px",
        padding: "14px 10px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        border: "3px solid #333",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      <div
        {...dragHandleProps}
        className="drag-handle"
        title="Verschieben"
        style={{ display: "flex", justifyContent: "center", padding: "2px 0 8px" }}
      >
        <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "#555" }} />
      </div>
      <strong style={{ fontSize: "0.75rem", textAlign: "center", color: "#fff", marginBottom: "6px" }}>Game-Chat</strong>
      <div
        ref={listRef}
        style={{
          flex: 1,
          background: "#1c1c1e",
          color: "#f2f2f2",
          borderRadius: "16px",
          padding: "10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          textAlign: "left",
        }}
      >
        {items.length === 0 && <p style={{ fontSize: "0.7rem", opacity: 0.6, textAlign: "center" }}>Noch nichts los…</p>}
        {items.map((item) => (
          <div
            key={item.id}
            style={{ background: "#2c2c2e", color: "#f2f2f2", borderRadius: "10px", padding: "6px 10px", fontSize: "0.7rem", boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            {item.text}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nachricht…"
          style={{
            flex: 1,
            fontSize: "0.7rem",
            padding: "6px 8px",
            background: "#2c2c2e",
            color: "#f2f2f2",
            border: "1px solid #3a3a3c",
            borderRadius: "8px",
            boxShadow: "none",
          }}
        />
        <button type="button" onClick={handleSend} style={{ fontSize: "0.7rem", padding: "6px 10px" }}>
          ➤
        </button>
      </div>
    </div>
  );
}
