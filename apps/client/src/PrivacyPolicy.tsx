const CONTACT_EMAIL = "lennyschawalder@gmail.com";

export function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem", color: "#eee", lineHeight: 1.6 }}>
      <h1>Datenschutzerklärung</h1>
      <p>
        Meme Tunes ist ein kostenloses, privates Party-Spiel-Projekt ohne kommerzielle Nutzung. Diese Erklärung
        beschreibt, welche Daten bei der Nutzung verarbeitet werden.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Lenny Schawalder
        <br />
        E-Mail: {CONTACT_EMAIL}
      </p>

      <h2>Welche Daten werden verarbeitet?</h2>
      <ul>
        <li>
          <strong>Spielername:</strong> Der beim Beitritt zu einer Lobby frei gewählte Name wird nur für die Dauer
          der Spielsitzung im Arbeitsspeicher des Servers gehalten und nicht dauerhaft gespeichert.
        </li>
        <li>
          <strong>Hochgeladene Bilder/Videos:</strong> Im Spielmodus "Eigene Bilder" hochgeladene Dateien werden nur
          temporär auf dem Server für die Dauer des Spiels gespeichert und danach nicht dauerhaft aufbewahrt.
        </li>
        <li>
          <strong>Technische Verbindungsdaten:</strong> Wie bei jedem Webdienst verarbeitet der Hosting-Anbieter
          technische Daten (z. B. IP-Adresse) zum Aufbau der Verbindung. Diese werden nicht für Tracking oder
          Profilbildung verwendet.
        </li>
      </ul>
      <p>Es findet keine Registrierung, kein Nutzerkonto und keine dauerhafte Speicherung von Nutzerdaten statt.</p>

      <h2>Eingebundene Drittanbieter-Dienste</h2>
      <ul>
        <li>
          <strong>YouTube (Google):</strong> Zur Song-Wiedergabe wird der YouTube IFrame Player eingebunden. Dabei
          gelten die Datenschutzbestimmungen von Google:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            policies.google.com/privacy
          </a>
          .
        </li>
        <li>
          <strong>Giphy:</strong> In manchen Spielmodi werden Meme-Bilder über die Giphy-API geladen. Es gelten die
          Datenschutzbestimmungen von Giphy:{" "}
          <a href="https://giphy.com/privacy" target="_blank" rel="noreferrer">
            giphy.com/privacy
          </a>
          .
        </li>
        <li>
          <strong>Hosting:</strong> Das Frontend wird über Vercel, das Backend über Render gehostet. Beide
          Anbieter verarbeiten technische Zugriffsdaten im Rahmen des Betriebs ihrer Infrastruktur.
        </li>
      </ul>

      <h2>Cookies und Tracking</h2>
      <p>
        Meme Tunes selbst setzt keine Tracking- oder Analyse-Cookies. Eingebundene Drittanbieter (insbesondere
        YouTube) können nach deren eigenen Bestimmungen Cookies setzen.
      </p>

      <h2>Rechte der Nutzer:innen</h2>
      <p>
        Da keine dauerhafte Speicherung personenbezogener Daten erfolgt, fallen in der Regel keine Daten an, über
        die Auskunft erteilt werden könnte. Bei Fragen oder Anliegen zum Datenschutz kannst du dich jederzeit per
        E-Mail an {CONTACT_EMAIL} wenden.
      </p>
    </div>
  );
}
