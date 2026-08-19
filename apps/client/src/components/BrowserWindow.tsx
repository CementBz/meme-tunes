import { type ReactNode, useState } from "react";

export interface BrowserTab {
  id: string;
  label: string;
  content: ReactNode;
  accentColor?: string;
}

interface BrowserWindowProps {
  tabs: BrowserTab[];
  defaultTabId?: string;
  width?: string;
}

export function BrowserWindow({ tabs, defaultTabId, width = "min(92vw, 720px)" }: BrowserWindowProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div
      style={{
        width,
        maxWidth: "100%",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        textAlign: "left",
      }}
    >
      <div style={{ background: "#202124", padding: "10px 12px 0", display: "flex", alignItems: "flex-end", gap: "4px" }}>
        <div style={{ display: "flex", gap: "6px", padding: "0 8px 8px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
        </div>
        <div style={{ display: "flex", gap: "2px", overflowX: "auto" }}>
          {tabs.map((tab) => {
            const isActive = tab.id === active?.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                style={{
                  background: isActive ? "#f1f3f4" : "#35363a",
                  color: isActive ? "#1a1a1a" : "#c8c8c8",
                  borderRadius: "8px 8px 0 0",
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  borderTop: isActive && tab.accentColor ? `2px solid ${tab.accentColor}` : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          background: "#f1f3f4",
          color: "#1a1a1a",
          padding: "20px",
          maxHeight: "min(60vh, 480px)",
          overflowY: "auto",
        }}
      >
        {active?.content}
      </div>
    </div>
  );
}
