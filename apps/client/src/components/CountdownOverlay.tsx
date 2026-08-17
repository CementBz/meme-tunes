import { useEffect, useState } from "react";
import { GAME_START_COUNTDOWN_SECONDS } from "@meme-tunes/shared";

function metronomeClick(): void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = 600;

    osc.type = "triangle";
    osc.frequency.value = 220;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext unavailable — countdown stays visual-only.
  }
}

export function CountdownOverlay() {
  const [count, setCount] = useState(GAME_START_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (count <= 0) return;
    metronomeClick();
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <section id="center">
      <div className="hud-scale-content">
        <h1 style={{ fontSize: "8rem" }}>{count > 0 ? count : ""}</h1>
      </div>
    </section>
  );
}
