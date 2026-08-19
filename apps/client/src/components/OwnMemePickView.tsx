import { useEffect, useState } from "react";
import { socket } from "../socket";
import { MemeMedia } from "./MemeMedia";
import { DragonFrameBackground } from "./DragonFrameBackground";

interface OwnMemePickViewProps {
  deadlineTs: number;
}

export function OwnMemePickView({ deadlineTs }: OwnMemePickViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((deadlineTs - Date.now()) / 1000))
  );
  const [candidate, setCandidate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((deadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [deadlineTs]);

  const fetchNext = () => {
    setLoading(true);
    socket.emit("request-meme-option", (url) => {
      setCandidate(url);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLockIn = () => {
    if (!candidate || locked) return;
    socket.emit("submit-own-meme", candidate);
    setLocked(true);
  };

  return (
    <section id="center">
      <DragonFrameBackground />
      <div className="hud-scale-content">
        <h1>Wähle dein eigenes Meme</h1>
        <p>Verbleibende Zeit: {remainingSeconds}s</p>

        {candidate ? (
          <MemeMedia url={candidate} alt="Meme-Vorschlag" style={{ maxWidth: "50vw", maxHeight: "45vh" }} />
        ) : (
          <p>{loading ? "Lädt…" : "Kein Bild verfügbar."}</p>
        )}

        {locked ? (
          <p>Gewählt ✅ Warte auf die anderen…</p>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={fetchNext} disabled={loading}>
              🔄 Nächstes Bild
            </button>
            <button type="button" className="btn-success" onClick={handleLockIn} disabled={!candidate || loading}>
              Das nehme ich!
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
