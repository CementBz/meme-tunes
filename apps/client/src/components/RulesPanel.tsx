import { useEffect, useState } from "react";

interface RuleSection {
  title: string;
  text: string;
}

const RULE_SECTIONS: RuleSection[] = [
  {
    title: "Spielablauf",
    text: "Jede Runde wird ein Meme gezeigt. Du suchst einen Song, den du als zum Bild passend empfindest, und legst den Startzeitpunkt fest. Alle Songs spielen nacheinander, jeder außer dem Einsender stimmt mit 👍/😐/👎 ab. Zusätzlich darf jede Person einmal pro Runde 🔥 vergeben und damit einem Song 3 Extra-Punkte geben. Nach allen Runden gibt's die Rangliste.",
  },
  {
    title: "Modus: Giphy Bilder",
    text: "Reihum darf jede Person aus 3 Giphy-Vorschlägen das Meme der Runde wählen (mit Reroll).",
  },
  {
    title: "Modus: Bessere",
    text: "Wie Giphy Bilder, aber die 3 Vorschläge kommen aus dem lokalen Bilder-/Video-Ordner.",
  },
  {
    title: "Modus: Eigene Bilder",
    text: "Zu Spielbeginn lädt jede Person bis zu 5 eigene Bilder/Videos hoch. Jede Runde werden 5 davon zufällig gezogen und alle stimmen ab, welches genommen wird.",
  },
];

const NARROW_BREAKPOINT = 700;

export function RulesPanel() {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < NARROW_BREAKPOINT);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isNarrow && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        style={{
          position: "fixed",
          top: "70px",
          left: "16px",
          zIndex: 900,
          background: "rgba(0,0,0,0.5)",
          color: "#ffffff",
          padding: "6px 10px",
          fontSize: "0.75rem",
        }}
      >
        ℹ️ Regeln
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",
        left: "16px",
        maxWidth: isNarrow ? "min(85vw, 320px)" : "210px",
        maxHeight: isNarrow ? "70vh" : "none",
        overflowY: isNarrow ? "auto" : "visible",
        zIndex: 900,
        background: "rgba(0,0,0,0.75)",
        padding: "10px 12px",
        color: "rgba(255,255,255,0.6)",
        fontSize: "0.7rem",
        lineHeight: 1.4,
      }}
    >
      {isNarrow && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "none",
            boxShadow: "none",
            color: "#ffffff",
            padding: "2px 6px",
          }}
        >
          ✕
        </button>
      )}
      <h2 style={{ fontSize: "0.95rem", color: "#ffffff", margin: "0 0 6px", fontWeight: 700 }}>Spielprinzip</h2>
      {RULE_SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: "6px" }}>
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>{section.title}</strong>
          <p style={{ margin: "2px 0 0" }}>{section.text}</p>
        </div>
      ))}
    </div>
  );
}
