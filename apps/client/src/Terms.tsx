const CONTACT_EMAIL = "lennyschawalder@gmail.com";

export function Terms() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem", color: "#eee", lineHeight: 1.6 }}>
      <h1>Nutzungsbedingungen</h1>
      <p>
        Meme Tunes ist ein kostenloses, privates Party-Spiel-Projekt ohne kommerzielle Nutzung, bereitgestellt von
        Lenny Schawalder ({CONTACT_EMAIL}). Mit der Nutzung des Spiels gelten die folgenden Bedingungen.
      </p>

      <h2>Nutzung</h2>
      <ul>
        <li>Das Spiel steht kostenlos zur Verfügung und richtet sich an private Spielrunden.</li>
        <li>Es besteht kein Anspruch auf ständige Verfügbarkeit oder fehlerfreien Betrieb.</li>
        <li>Inhalte (Bilder, Songwahl, Chat-ähnliche Eingaben wie Spielernamen) müssen von den Nutzer:innen
          rechtmäßig sein und dürfen keine Rechte Dritter verletzen.</li>
        <li>Der Betreiber behält sich vor, den Dienst jederzeit ohne Vorankündigung zu ändern oder einzustellen.</li>
      </ul>

      <h2>YouTube-Inhalte</h2>
      <p>
        Zur Song-Wiedergabe bindet Meme Tunes den offiziellen YouTube IFrame Player ein. Für die Nutzung von
        YouTube-Inhalten über diese Funktion gelten zusätzlich die YouTube-Nutzungsbedingungen von Google:{" "}
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">
          youtube.com/t/terms
        </a>
        .
      </p>

      <h2>Haftung</h2>
      <p>
        Die Nutzung erfolgt auf eigene Verantwortung. Für Inhalte Dritter (z. B. eingebettete YouTube-Videos oder
        über Giphy geladene Bilder) übernehmen wir keine Haftung.
      </p>

      <h2>Kontakt</h2>
      <p>Fragen zu diesen Nutzungsbedingungen richtest du gerne per E-Mail an {CONTACT_EMAIL}.</p>
    </div>
  );
}
