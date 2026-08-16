import { useEffect, useState } from "react";
import { GAME_START_COUNTDOWN_SECONDS } from "@meme-tunes/shared";

function beep(frequency: number): void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext unavailable — countdown stays visual-only.
  }
}

export function CountdownOverlay() {
  const [count, setCount] = useState(GAME_START_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (count <= 0) return;
    beep(count === 1 ? 1046 : 784);
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
