import { useEffect, useRef, useState } from "react";

interface MusicPlayerProps {
  phaseAllowsMusic: boolean;
  prankEnabled: boolean;
  musicOn: boolean;
  onToggle: (on: boolean) => void;
  volume: number;
  showButton?: boolean;
}

const PRANK_ATTEMPTS = 3;
const BASE_TOP = 16;
const BASE_OFFSET_X = 0;

export function MusicPlayer({
  phaseAllowsMusic,
  prankEnabled,
  musicOn,
  onToggle,
  volume,
  showButton = true,
}: MusicPlayerProps) {
  const [prankStep, setPrankStep] = useState(0);
  const [position, setPosition] = useState({ top: BASE_TOP, offsetX: BASE_OFFSET_X });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef({ musicOn, phaseAllowsMusic });
  stateRef.current = { musicOn, phaseAllowsMusic };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    if (musicOn && phaseAllowsMusic) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [musicOn, phaseAllowsMusic, volume]);

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

  const handleClick = () => {
    if (!musicOn) {
      onToggle(true);
      setPrankStep(0);
      setPosition({ top: BASE_TOP, offsetX: BASE_OFFSET_X });
      return;
    }

    if (prankEnabled && prankStep < PRANK_ATTEMPTS) {
      setPosition({
        top: Math.max(8, BASE_TOP + Math.random() * 80),
        offsetX: Math.random() * 260 - 130,
      });
      setPrankStep((n) => n + 1);
      return;
    }

    onToggle(false);
    setPrankStep(0);
    setPosition({ top: BASE_TOP, offsetX: BASE_OFFSET_X });
  };

  // Once the game has started, the button sits in a fixed corner instead of
  // top-center — centered screens (like the voting view) have their content
  // vertically centered too, and can grow tall enough to collide with a
  // top-center button. A static corner spot never overlaps that content.
  const inGame = !phaseAllowsMusic;

  return (
    <>
      <audio ref={audioRef} src="/background-music.wav" loop />
      {showButton && (
        <button
          type="button"
          onClick={handleClick}
          className="pill-badge"
          style={{
            position: "fixed",
            top: inGame ? "16px" : `${position.top}px`,
            left: inGame ? "16px" : "50%",
            transform: inGame ? "none" : `translateX(calc(-50% + ${position.offsetX}px))`,
            background: musicOn ? "rgba(209, 102, 102, 0.85)" : "rgba(255, 255, 255, 0.12)",
            color: musicOn ? "#2b0a0a" : "#ffffff",
            transition: "top 0.15s ease, transform 0.15s ease, background 0.2s ease",
          }}
        >
          {musicOn ? "🔊 Musik aus" : "🔇 Musik ein"}
        </button>
      )}
    </>
  );
}
