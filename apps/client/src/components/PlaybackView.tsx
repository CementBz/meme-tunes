import { useEffect, useRef } from "react";
import type { SongSourceType } from "@meme-tunes/shared";
import { loadYoutubeIframeApi } from "../youtubeIframeApi";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

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
        <img src={memeUrl} alt="Meme der Runde" style={{ maxWidth: "85vw", maxHeight: "70vh", borderRadius: 0 }} />

        {/* Audio only: the actual player stays invisible, only the meme image is shown. */}
        {source === "youtube" && <div ref={wrapperRef} style={{ width: 1, height: 1, overflow: "hidden" }} />}
        {source === "upload" && fileUrl && (
          <video
            src={`${SERVER_URL}${fileUrl}`}
            autoPlay
            onLoadedMetadata={(e) => {
              e.currentTarget.currentTime = startSeconds;
              e.currentTarget.play().catch(() => {});
            }}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />
        )}

        {canVote && !hasVoted && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="button" onClick={() => onVote("up")}>
              👍
            </button>
            <button type="button" onClick={() => onVote("down")}>
              👎
            </button>
          </div>
        )}

        {!canVote && <p>Das ist dein eigener Song — kein Voting für dich.</p>}
        {canVote && hasVoted && !result && <p>Danke für deine Stimme!</p>}
        {result && (
          <>
            <p>
              👍 {result.upVotes} — 👎 {result.downVotes}
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
