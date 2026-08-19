import { useEffect, useRef, useState } from "react";
import type { PreviewSearchResult } from "@meme-tunes/shared";
import type { SongSubmission } from "../types";

interface PreviewTabProps {
  source: "itunes" | "deezer";
  hint: string;
  search: (query: string, ack: (res: PreviewSearchResult[]) => void) => void;
  previewVolume: number;
  onPreviewVolumeChange: (v: number) => void;
  onSubmit: (data: SongSubmission) => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PreviewTab({ source, hint, search, previewVolume, onPreviewVolumeChange, onSubmit }: PreviewTabProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PreviewSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PreviewSearchResult | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(30);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = previewVolume;
  }, [previewVolume, selected]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    search(query.trim(), (res) => {
      setResults(res);
      setSearching(false);
    });
  };

  const handleSelect = (result: PreviewSearchResult) => {
    setSelected(result);
    setStartSeconds(0);
    setPreviewDuration(30);
  };

  const handlePreview = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = startSeconds;
    audio.play().catch(() => {});
    setTimeout(() => audio.pause(), 5000);
  };

  const maxStart = Math.max(0, previewDuration - 10);

  return (
    <div className="browser-tab-content">
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Songtitel oder Interpret suchen"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button type="button" onClick={handleSearch} disabled={searching}>
          {searching ? "Suche…" : "Suchen"}
        </button>
      </div>

      {!selected && (
        <p style={{ fontSize: "0.8rem", color: "var(--text)", marginTop: "0.5rem" }}>{hint}</p>
      )}

      {results.length > 0 && !selected && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {results.map((r) => (
            <li key={r.previewUrl} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <img src={r.artworkUrl} alt="" width={60} />
              <button type="button" onClick={() => handleSelect(r)} style={{ textAlign: "left", flex: 1 }}>
                {r.title} — {r.artist}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontSize: "0.8rem" }}>
            {selected.title} — {selected.artist}
          </p>
          <audio
            ref={audioRef}
            src={selected.previewUrl}
            onLoadedMetadata={(e) => setPreviewDuration(e.currentTarget.duration || 30)}
            style={{ display: "none" }}
          />
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
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem", fontSize: "0.75rem" }}>
            Vorhör-Lautstärke: {Math.round(previewVolume * 100)}%
            <input
              type="range"
              className="white-slider"
              min={0}
              max={1}
              step={0.01}
              value={previewVolume}
              onChange={(e) => onPreviewVolumeChange(Number(e.target.value))}
              style={{ width: "160px" }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={handlePreview}>
              Vorhören
            </button>
            <button
              type="button"
              className="btn-success"
              onClick={() =>
                onSubmit({
                  source,
                  videoId: null,
                  fileUrl: selected.previewUrl,
                  title: selected.title,
                  channel: selected.artist,
                  thumbnailUrl: selected.artworkUrl,
                  startSeconds,
                  memeText: null,
                  memeTextPosition: null,
                })
              }
            >
              Song einreichen
            </button>
            <button type="button" onClick={() => setSelected(null)}>
              Andere Wahl
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
