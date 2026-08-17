import { useEffect, useRef, useState } from "react";
import type { SongSourceType } from "@meme-tunes/shared";
import { loadYoutubeIframeApi } from "../youtubeIframeApi";
import { MemeMedia } from "./MemeMedia";
import { ThumbDownIcon, ThumbUpIcon } from "./ThumbIcons";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const DEFAULT_VOLUME = 0.5;

interface PlaybackViewProps {
  submissionId: string;
  source: SongSourceType;
  videoId: string | null;
  fileUrl: string | null;
  startSeconds: number;
  playerName: string;
  memeUrl: string;
  canVote: boolean;
  hasVoted: boolean;
  onVote: (vote: "up" | "down") => void;
  result: { upVotes: number; downVotes: number; upVoterNames?: string[]; downVoterNames?: string[] } | null;
}

export function PlaybackView({
  submissionId,
  source,
  videoId,
  fileUrl,
  startSeconds,
  playerName,
  memeUrl,
  canVote,
  hasVoted,
  onVote,
  result,
}: PlaybackViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    if (source !== "youtube" || !videoId) return;
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
        videoId,
        width: "1",
        height: "1",
        playerVars: { start: Math.floor(startSeconds), autoplay: 1 },
        events: {
          onReady: (e) => {
            e.target.seekTo(startSeconds, true);
            e.target.setVolume(volume * 100);
            e.target.playVideo();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, source, videoId]);

  useEffect(() => {
    playerRef.current?.setVolume(volume * 100);
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  return (
    <section id="center" style={{ position: "relative" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/bg-round.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -2,
        }}
      />

      <div className="hud-scale-content" style={{ position: "relative", zIndex: 1 }}>
        <h2>{playerName}s Song</h2>
        <MemeMedia url={memeUrl} alt="Meme der Runde" style={{ maxWidth: "85vw", maxHeight: "70vh", borderRadius: 0 }} />

        {/* Audio only: the actual player stays invisible, only the meme image is shown. */}
        {source === "youtube" && <div ref={wrapperRef} style={{ width: 1, height: 1, overflow: "hidden" }} />}
        {source === "upload" && fileUrl && (
          <video
            ref={videoRef}
            src={`${SERVER_URL}${fileUrl}`}
            autoPlay
            onLoadedMetadata={(e) => {
              e.currentTarget.currentTime = startSeconds;
              e.currentTarget.volume = volume;
              e.currentTarget.play().catch(() => {});
            }}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />
        )}

        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
          Lautstärke: {Math.round(volume * 100)}%
          <input
            type="range"
            className="white-slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: "200px" }}
          />
        </label>

        {canVote && !hasVoted && (
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button
              type="button"
              onClick={() => onVote("up")}
              style={{ background: "none", boxShadow: "none", padding: "4px" }}
            >
              <ThumbUpIcon size={64} />
            </button>
            <button
              type="button"
              onClick={() => onVote("down")}
              style={{ background: "none", boxShadow: "none", padding: "4px" }}
            >
              <ThumbDownIcon size={64} />
            </button>
          </div>
        )}

        {!canVote && <p>Das ist dein eigener Song — kein Voting für dich.</p>}
        {canVote && hasVoted && !result && <p>Danke für deine Stimme!</p>}
        {result && (
          <>
            <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
              <ThumbUpIcon size={28} /> {result.upVotes} — <ThumbDownIcon size={28} /> {result.downVotes}
            </p>
            {result.upVoterNames && result.upVoterNames.length > 0 && (
              <p>👍 {result.upVoterNames.join(", ")}</p>
            )}
            {result.downVoterNames && result.downVoterNames.length > 0 && (
              <p>👎 {result.downVoterNames.join(", ")}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
