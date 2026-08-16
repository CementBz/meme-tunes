import { useEffect, useRef } from "react";

interface RoundMusicProps {
  playing: boolean;
}

const VOLUME = 0.06;

export function RoundMusic({ playing }: RoundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = VOLUME;

    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [playing]);

  return <audio ref={audioRef} src="/round-music.wav" loop />;
}
