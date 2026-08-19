interface FeedItem {
  id: string;
  text: string;
}

interface PhoneMockupProps {
  items: FeedItem[];
}

export function PhoneMockup({ items }: PhoneMockupProps) {
  return (
    <div
      style={{
        width: "220px",
        height: "min(60vh, 420px)",
        background: "#111",
        borderRadius: "28px",
        padding: "14px 10px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        border: "3px solid #333",
      }}
    >
      <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "#444", margin: "0 auto 10px" }} />
      <div
        style={{
          flex: 1,
          background: "#f1f3f4",
          color: "#1a1a1a",
          borderRadius: "16px",
          padding: "10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          textAlign: "left",
        }}
      >
        <strong style={{ fontSize: "0.75rem", textAlign: "center" }}>Game-Chat</strong>
        {items.length === 0 && <p style={{ fontSize: "0.7rem", opacity: 0.6, textAlign: "center" }}>Noch nichts los…</p>}
        {items.map((item) => (
          <div
            key={item.id}
            style={{ background: "#fff", borderRadius: "10px", padding: "6px 10px", fontSize: "0.7rem", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
