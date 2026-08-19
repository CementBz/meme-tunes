import { type ReactNode, useState } from "react";
import { useDraggable } from "../hooks/useDraggable";

export interface BrowserTab {
  id: string;
  label: string;
  content: ReactNode;
  accentColor?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface BrowserWindowProps {
  tabs: BrowserTab[];
  defaultTabId?: string;
  width?: string;
}

export function BrowserWindow({ tabs, defaultTabId, width = "min(92vw, 720px)" }: BrowserWindowProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const { offset, dragHandleProps } = useDraggable();

  return (
    <div
      className="browser-window-outer"
      style={{
        width,
        maxWidth: "100%",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        textAlign: "left",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      <div style={{ background: "#202124", display: "flex", flexDirection: "column" }}>
        <div
          {...dragHandleProps}
          className="drag-handle"
          title="Verschieben"
          style={{ display: "flex", justifyContent: "center", padding: "6px 0 2px" }}
        >
          <div style={{ width: 44, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.28)" }} />
        </div>
        <div style={{ padding: "0 12px 0", display: "flex", alignItems: "flex-end", gap: "4px" }}>
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
                    background: tab.accentColor
                      ? isActive
                        ? tab.accentColor
                        : hexToRgba(tab.accentColor, 0.28)
                      : isActive
                        ? "#2c2c2e"
                        : "#35363a",
                    color: isActive ? "#ffffff" : "#e2e2e2",
                    borderRadius: "8px 8px 0 0",
                    padding: "8px 16px",
                    fontSize: "0.8rem",
                    fontWeight: isActive ? 700 : 500,
                    boxShadow: "none",
                    whiteSpace: "nowrap",
                    textShadow: tab.accentColor ? "0 1px 2px rgba(0,0,0,0.35)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#1c1c1e",
          color: "#f2f2f2",
          padding: "20px",
          height: "min(52vh, 420px)",
          overflowY: "auto",
        }}
      >
        {active?.content}
      </div>
    </div>
  );
}
