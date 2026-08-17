import { useEffect, useRef, useState } from "react";
import { MAX_UPLOADS_PER_PLAYER } from "@meme-tunes/shared";
import { MemeMedia } from "./MemeMedia";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp,video/mp4,.jpg,.jpeg,.png,.gif,.webp,.mp4";

interface MemeUploadViewProps {
  deadlineTs: number;
  paused: boolean;
  onUpload: (url: string) => void;
}

export function MemeUploadView({ deadlineTs, paused, onUpload }: MemeUploadViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((deadlineTs - Date.now()) / 1000))
  );
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((deadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [deadlineTs, paused]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${SERVER_URL}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload fehlgeschlagen.");
      setUploaded((prev) => [...prev, data.url]);
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  const reachedMax = uploaded.length >= MAX_UPLOADS_PER_PLAYER;

  return (
    <section id="center">
      <div className="hud-scale-content">
        <h1>Eigene Bilder hinzufügen</h1>
        <p>Bis zu {MAX_UPLOADS_PER_PLAYER} Bilder in den Pool werfen!</p>
        <p>Verbleibende Zeit: {remainingSeconds}s</p>
        {paused && <p>⏸ Pausiert</p>}
        <p>
          {uploaded.length} / {MAX_UPLOADS_PER_PLAYER} hochgeladen
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          disabled={uploading || reachedMax}
        />

        {uploading && <p>Lädt hoch…</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {reachedMax && <p>Maximum erreicht.</p>}

        {uploaded.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {uploaded.map((url, i) => (
              <MemeMedia
                key={i}
                url={url}
                alt={`Eigenes Bild ${i + 1}`}
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
