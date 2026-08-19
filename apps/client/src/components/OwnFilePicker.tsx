import { useRef, useState } from "react";
import type { SongSubmission } from "../types";

interface OwnFilePickerProps {
  onSubmit: (data: SongSubmission) => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const ACCEPTED_TYPES = ".mp3,.wav,.mp4,audio/mpeg,audio/wav,video/mp4";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function OwnFilePicker({ onSubmit }: OwnFilePickerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setError(null);
    setFile(selectedFile);
    setStartSeconds(0);
    setDuration(0);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(URL.createObjectURL(selectedFile));
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) setDuration(mediaRef.current.duration);
  };

  const handlePreview = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = startSeconds;
    media.play();
    setTimeout(() => media.pause(), 5000);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${SERVER_URL}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload fehlgeschlagen.");

      onSubmit({
        source: "upload",
        videoId: null,
        fileUrl: data.url,
        title: file.name,
        channel: "Eigene Datei",
        thumbnailUrl: "",
        startSeconds,
        memeText: null,
        memeTextPosition: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  const maxStart = Math.max(0, duration - 10);

  return (
    <div>
      <input type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} />

      {objectUrl && (
        <div style={{ marginTop: "1rem" }}>
          <p>{file?.name}</p>
          <video
            ref={mediaRef}
            src={objectUrl}
            onLoadedMetadata={handleLoadedMetadata}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />

          {duration > 0 && (
            <>
              <div style={{ marginTop: "0.5rem" }}>
                <label>
                  Startzeitpunkt: {formatTime(startSeconds)}
                  <input
                    type="range"
                    className="start-time-slider"
                    min={0}
                    max={maxStart}
                    value={startSeconds}
                    onChange={(e) => setStartSeconds(Number(e.target.value))}
                    style={{ display: "block", marginTop: "0.5rem" }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={handlePreview}>
                  Vorhören
                </button>
                <button type="button" className="btn-success" onClick={handleSubmit} disabled={uploading}>
                  {uploading ? "Lädt hoch…" : "Song einreichen"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
