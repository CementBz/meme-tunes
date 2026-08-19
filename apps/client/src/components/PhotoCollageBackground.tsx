import { useEffect, useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const COLUMN_COUNT = 6;
const POOL_SIZE = 42;

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
}

interface PhotoCollageBackgroundProps {
  blurred?: boolean;
  animated?: boolean;
}

export function PhotoCollageBackground({ blurred = false, animated = true }: PhotoCollageBackgroundProps) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/image-pool?count=${POOL_SIZE}`)
      .then((res) => res.json())
      .then((data: { urls: string[] }) => {
        if (!cancelled) setImages(data.urls.map(resolveUrl));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (images.length === 0) return null;

  const columns = Array.from({ length: COLUMN_COUNT }, (_, i) => images.filter((_, idx) => idx % COLUMN_COUNT === i));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -2,
        display: "flex",
        overflow: "hidden",
        filter: blurred ? "blur(8px)" : "none",
        transition: "filter 0.25s ease",
        background: "#0a0a0a",
      }}
    >
      {columns.map((col, i) => (
        <div key={i} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div
            className={animated ? (i % 2 === 0 ? "collage-scroll-up" : "collage-scroll-down") : undefined}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              animationDuration: animated ? `${28 + i * 4}s` : undefined,
            }}
          >
            {[...col, ...col].map((url, j) => (
              <img key={j} src={url} alt="" style={{ width: "100%", display: "block", marginBottom: "6px" }} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
    </div>
  );
}
