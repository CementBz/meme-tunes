import type { CSSProperties } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
}

function isVideo(url: string): boolean {
  const lower = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.split("?")[0].endsWith(ext));
}

interface MemeMediaProps {
  url: string;
  alt: string;
  style?: CSSProperties;
}

export function MemeMedia({ url, alt, style }: MemeMediaProps) {
  const resolved = resolveUrl(url);

  if (isVideo(resolved)) {
    return <video src={resolved} autoPlay loop muted playsInline style={style} />;
  }

  return <img src={resolved} alt={alt} style={style} />;
}
