export class PausableTimer {
  private remainingMs: number;
  private startedAt = 0;
  private handle: NodeJS.Timeout | null = null;
  private onDone: (() => void) | null;

  constructor(ms: number, onDone: () => void) {
    this.remainingMs = ms;
    this.onDone = onDone;
    this.startedAt = Date.now();
    this.handle = setTimeout(() => this.fire(), ms);
  }

  private fire(): void {
    this.handle = null;
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }

  pause(): void {
    if (!this.handle) return;
    clearTimeout(this.handle);
    this.handle = null;
    this.remainingMs = Math.max(0, this.remainingMs - (Date.now() - this.startedAt));
  }

  resume(): void {
    if (this.handle || !this.onDone) return;
    this.startedAt = Date.now();
    this.handle = setTimeout(() => this.fire(), this.remainingMs);
  }

  cancel(): void {
    if (this.handle) clearTimeout(this.handle);
    this.handle = null;
    this.onDone = null;
  }

  get remaining(): number {
    return this.remainingMs;
  }
}
