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

export function RulesTab() {
  return (
    <div className="browser-tab-content">
      <h2 style={{ margin: 0 }}>Spielprinzip</h2>
      {RULE_SECTIONS.map((section) => (
        <div key={section.title}>
          <strong>{section.title}</strong>
          <p style={{ margin: "2px 0 0" }}>{section.text}</p>
        </div>
      ))}
    </div>
  );
}
