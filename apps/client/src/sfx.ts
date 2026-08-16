export function playSfx(path: string, volume = 1): void {
  const audio = new Audio(path);
  audio.volume = volume;
  audio.play().catch(() => {});
}
