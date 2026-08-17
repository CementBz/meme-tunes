import { useEffect, useRef, useState } from "react";

interface MusicPlayerProps {
  phaseAllowsMusic: boolean;
  prankEnabled: boolean;
  musicOn: boolean;
  onToggle: (on: boolean) => void;
}

const PRANK_ATTEMPTS = 3;
const BASE_TOP = 16;
const BASE_OFFSET_X = 0;
const VOLUME = 0.05;

export function MusicPlayer({ phaseAllowsMusic, prankEnabled, musicOn, onToggle }: MusicPlayerProps) {
  const [prankStep, setPrankStep] = useState(0);
  const [position, setPosition] = useState({ top: BASE_TOP, offsetX: BASE_OFFSET_X });
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

  return (
    <>
      <audio ref={audioRef} src="/background-music.wav" loop />
      <button
        type="button"
        onClick={handleClick}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: "50%",
          transform: `translateX(calc(-50% + ${position.offsetX}px))`,
          background: musicOn ? "#D16666" : "#80d39b",
          color: "#1a0505",
          zIndex: 1000,
          transition: "top 0.15s ease, transform 0.15s ease",
        }}
      >
        {musicOn ? "Musik aus" : "Musik ein"}
      </button>
    </>
  );
}
