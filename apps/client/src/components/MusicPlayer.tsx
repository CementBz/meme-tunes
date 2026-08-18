import { useEffect, useRef } from "react";

interface MusicPlayerProps {
  phaseAllowsMusic: boolean;
  musicOn: boolean;
  onToggle: (on: boolean) => void;
}

const VOLUME = 0.05;

export function MusicPlayer({ phaseAllowsMusic, musicOn, onToggle }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef({ musicOn, phaseAllowsMusic });
  stateRef.current = { musicOn, phaseAllowsMusic };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = VOLUME;

    if (musicOn && phaseAllowsMusic) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [musicOn, phaseAllowsMusic]);

  // Browsers block audio-with-sound until the page has seen a real user
  // gesture. Unlock playback on the very first click/tap anywhere on the
  // page, instead of requiring the user to hit the music button itself.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const unlock = () => {
      document.removeEventListener("pointerdown", unlock);
      audio
        .play()
        .then(() => {
          if (!(stateRef.current.musicOn && stateRef.current.phaseAllowsMusic)) {
            audio.pause();
          }
        })
        .catch(() => {});
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <>
      <audio ref={audioRef} src="/background-music.wav" loop />
      <button
        type="button"
        onClick={() => onToggle(!musicOn)}
        style={{ background: "none", border: "none", boxShadow: "none", padding: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
      >
        {musicOn ? "Musik aus" : "Musik ein"}
      </button>
    </>
  );
}
