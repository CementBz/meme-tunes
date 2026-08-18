import { useEffect, useRef, useState } from "react";
import type { YoutubeSearchResult } from "@meme-tunes/shared";
import type { SongSubmission } from "../types";
import { socket } from "../socket";
import { loadYoutubeIframeApi } from "../youtubeIframeApi";
import { OwnFilePicker } from "./OwnFilePicker";
import { PreviewTab } from "./PreviewTab";

interface SongPickerProps {
  songHints: YoutubeSearchResult[];
  onSubmit: (data: SongSubmission) => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongPicker({ songHints, onSubmit }: SongPickerProps) {
  const [mode, setMode] = useState<"youtube" | "upload" | "hints" | "itunes" | "deezer">("youtube");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YoutubeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<YoutubeSearchResult | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [previewVolume, setPreviewVolume] = useState(0.5);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    socket.emit("search-songs", query.trim(), (res) => {
      setResults(res);
      setSearching(false);
    });
  };

  const handleSelect = (result: YoutubeSearchResult) => {
    setSelected(result);
    setStartSeconds(0);
  };

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    loadYoutubeIframeApi().then((YT_API) => {
      if (cancelled || !wrapperRef.current) return;

      // The YouTube API replaces its target element with an <iframe>, which
      // would conflict with React's own DOM bookkeeping. Give it a plain
      // mount point that React never touches again after creating it.
      wrapperRef.current.innerHTML = "";
      const mountPoint = document.createElement("div");
      wrapperRef.current.appendChild(mountPoint);

      playerRef.current = new YT_API.Player(mountPoint, {
        videoId: selected.videoId,
        width: "320",
        height: "180",
        playerVars: { start: 0 },
        events: {
          onReady: (e) => e.target.setVolume(previewVolume * 100),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.videoId]);

  useEffect(() => {
    playerRef.current?.setVolume(previewVolume * 100);
  }, [previewVolume]);

  const handlePreview = () => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(startSeconds, true);
    player.playVideo();
    setTimeout(() => player.pauseVideo(), 5000);
  };

  const maxStart = selected ? Math.max(0, selected.durationSeconds - 10) : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setMode("youtube")} disabled={mode === "youtube"}>
          YouTube
        </button>
        <button type="button" onClick={() => setMode("itunes")} disabled={mode === "itunes"}>
          iTunes
        </button>
        <button type="button" onClick={() => setMode("deezer")} disabled={mode === "deezer"}>
          Deezer
        </button>
        <button type="button" onClick={() => setMode("upload")} disabled={mode === "upload"}>
          Own Files
        </button>
        {songHints.length > 0 && (
          <button type="button" onClick={() => setMode("hints")} disabled={mode === "hints"}>
            Vorschläge
          </button>
        )}
      </div>

      {mode === "upload" && <OwnFilePicker onSubmit={onSubmit} />}

      {mode === "hints" && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {songHints.map((r) => (
            <li key={r.videoId} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <img src={r.thumbnailUrl} alt="" width={60} />
              <button
                type="button"
                onClick={() =>
                  onSubmit({
                    source: "youtube",
                    videoId: r.videoId,
                    fileUrl: null,
                    title: r.title,
                    channel: r.channel,
                    thumbnailUrl: r.thumbnailUrl,
                    startSeconds: 0,
                  })
                }
                style={{ textAlign: "left", flex: 1 }}
              >
                {r.title} — {r.channel} ({formatTime(r.durationSeconds)})
              </button>
            </li>
          ))}
        </ul>
      )}

      {mode === "youtube" && (
        <>
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

          {new URLSearchParams(window.location.search).get("debug") === "1" && !selected && (
            <button
              type="button"
              onClick={() =>
                handleSelect({
                  videoId: "dQw4w9WgXcQ",
                  title: "Never Gonna Give You Up",
                  channel: "Rick Astley",
                  thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                  durationSeconds: 212,
                })
              }
              style={{ marginTop: "0.5rem" }}
            >
              Debug: Vorschau ohne Suche
            </button>
          )}

          {!selected && (
            <p style={{ fontSize: "0.8rem", color: "var(--text)", marginTop: "0.5rem" }}>
              ⚠️ Eventuelle Ausfälle: YouTube begrenzt die tägliche Anzahl an Suchen. Falls die Suche mal nichts
              findet, einfach "iTunes" oder "Deezer" daneben probieren.
            </p>
          )}

          {results.length > 0 && !selected && (
            <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
              {results.map((r) => (
                <li key={r.videoId} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <img src={r.thumbnailUrl} alt="" width={60} />
                  <button type="button" onClick={() => handleSelect(r)} style={{ textAlign: "left", flex: 1 }}>
                    {r.title} — {r.channel} ({formatTime(r.durationSeconds)})
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.8rem" }}>
                {selected.title} — {selected.channel}
              </p>
              <div ref={wrapperRef} />
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
                  onChange={(e) => setPreviewVolume(Number(e.target.value))}
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
                      source: "youtube",
                      videoId: selected.videoId,
                      fileUrl: null,
                      title: selected.title,
                      channel: selected.channel,
                      thumbnailUrl: selected.thumbnailUrl,
                      startSeconds,
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
        </>
      )}

      {mode === "itunes" && (
        <PreviewTab
          source="itunes"
          hint="Kostenlose Vorschau von Apple — jeder Treffer ist ein ca. 30-Sekunden-Ausschnitt, kein ganzer Song. Die Rundenzeit läuft beim Suchen weiter, also nicht endlos durchskippen."
          search={(q, ack) => socket.emit("search-itunes", q, ack)}
          previewVolume={previewVolume}
          onPreviewVolumeChange={setPreviewVolume}
          onSubmit={onSubmit}
        />
      )}

      {mode === "deezer" && (
        <PreviewTab
          source="deezer"
          hint="Kostenlose Vorschau von Deezer — jeder Treffer ist ein ca. 30-Sekunden-Ausschnitt, kein ganzer Song. Die Rundenzeit läuft beim Suchen weiter, also nicht endlos durchskippen."
          search={(q, ack) => socket.emit("search-deezer", q, ack)}
          previewVolume={previewVolume}
          onPreviewVolumeChange={setPreviewVolume}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
