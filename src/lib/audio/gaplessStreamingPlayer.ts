/**
 * Gapless streaming playback using Web Audio API.
 * Schedules each decoded chunk to start exactly when the previous one ends,
 * so there is no silence between chunks.
 */

export type GaplessStreamingPlayerCallbacks = {
  onProgress: (currentTime: number, duration: number) => void;
  onStreamEnded: () => void;
};

export class GaplessStreamingPlayer {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private firstStartTime = 0;
  private totalScheduledDuration = 0;
  private receivedComplete = false;
  private rafId: number | null = null;
  private playbackRate = 1;
  private callbacks: GaplessStreamingPlayerCallbacks;
  private stopped = false;
  private paused = false;

  constructor(callbacks: GaplessStreamingPlayerCallbacks) {
    this.callbacks = callbacks;
  }

  private getContext(): AudioContext {
    if (this.stopped) throw new Error("Player stopped");
    if (!this.context) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.context = new Ctx();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }
    return this.context;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isStopped(): boolean {
    return this.stopped;
  }

  getCurrentTime(): number {
    if (!this.context || !this.totalScheduledDuration) return 0;
    if (this.paused) return this._pausedAt ?? 0;
    return Math.max(
      0,
      Math.min(
        this.context.currentTime - this.firstStartTime,
        this.totalScheduledDuration,
      ),
    );
  }

  private _pausedAt = 0;

  setVolume(value: number): void {
    if (this.gainNode) this.gainNode.gain.value = value;
  }

  setPlaybackRate(value: number): void {
    this.playbackRate = value;
  }

  /**
   * Schedule a WAV chunk for gapless playback. Call as chunks arrive.
   */
  async scheduleChunk(wavArrayBuffer: ArrayBuffer): Promise<void> {
    if (this.stopped) return;
    const ctx = this.getContext();
    const gain = this.gainNode!;

    const buffer = await ctx.decodeAudioData(wavArrayBuffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.playbackRate;
    source.connect(gain);

    const now = ctx.currentTime;
    if (this.totalScheduledDuration === 0) {
      this.firstStartTime = now;
      this.nextStartTime = now;
      try {
        if (ctx.state === "suspended") await ctx.resume();
      } catch {
        // ignore
      }
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.totalScheduledDuration += buffer.duration;

    if (this.rafId === null) {
      this.tick();
    }
  }

  private tick = (): void => {
    if (this.stopped || !this.context) return;

    // When paused, stop ticking until resumed
    if (this.paused) {
      this._pausedAt = Math.max(
        0,
        Math.min(
          this.context.currentTime - this.firstStartTime,
          this.totalScheduledDuration,
        ),
      );
      this.rafId = null;
      return;
    }

    const ctx = this.context;
    const currentTime = Math.max(
      0,
      Math.min(
        ctx.currentTime - this.firstStartTime,
        this.totalScheduledDuration,
      ),
    );
    this.callbacks.onProgress(currentTime, this.totalScheduledDuration);

    if (this.receivedComplete && ctx.currentTime >= this.nextStartTime - 0.05) {
      this.callbacks.onStreamEnded();
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  /** Call when worker has sent "complete" and no more chunks will arrive. */
  markComplete(): void {
    this.receivedComplete = true;
  }

  /** Pause playback (does not cancel scheduled chunks — resumes where left off). */
  pause(): void {
    if (this.stopped || this.paused) return;
    this.paused = true;
    this.context?.suspend();
    // Save paused position for progress display
    if (this.context) {
      this._pausedAt = Math.max(
        0,
        Math.min(
          this.context.currentTime - this.firstStartTime,
          this.totalScheduledDuration,
        ),
      );
    }
  }

  /** Resume playback from where it was paused. */
  resume(): void {
    if (this.stopped || !this.paused) return;
    this.paused = false;
    this.context?.resume();
    // Restart tick to keep updating progress
    if (this.rafId === null) {
      this.tick();
    }
  }

  /** Stop playback and release resources. */
  stop(): void {
    this.stopped = true;
    this.paused = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.context) {
      this.context.suspend().catch(() => {});
    }
  }
}
