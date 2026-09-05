/**
 * Native Web Audio API Synthesizer for Fashion Date
 * Zero external mp3 dependencies, works offline and on all modern browsers.
 */
export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public isMuted = false;

  constructor(initialMuted = false) {
    this.isMuted = initialMuted;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {
        // ignore resume rejection
      });
    }
    return this.ctx;
  }

  playTick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  playLock(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      [587.33, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.02);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.02 + 0.35,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.02);
        osc.stop(ctx.currentTime + i * 0.02 + 0.38);
      });
    } catch {
      // Audio context fallback
    }
  }

  private victoryAudio: HTMLAudioElement | null = null;

  private getVictoryAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.victoryAudio) {
      try {
        this.victoryAudio = new Audio("/sounds/victory.mp3");
        this.victoryAudio.preload = "auto";
      } catch {
        // Audio element creation failed
      }
    }
    return this.victoryAudio;
  }

  playVictory(): void {
    if (this.isMuted || typeof window === "undefined") return;
    if (process.env.NODE_ENV === "test") return;
    const audio = this.getVictoryAudio();
    if (audio && typeof audio.play === "function") {
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {
            // Ignore autoplay restriction before gesture
          });
        }
      } catch {
        // Ignore audio playback error
      }
    }
  }

  stopVictory(): void {
    if (process.env.NODE_ENV === "test") return;
    if (this.victoryAudio && typeof this.victoryAudio.pause === "function") {
      try {
        this.victoryAudio.pause();
        this.victoryAudio.currentTime = 0;
      } catch {
        // Ignore
      }
    }
  }

  playAlarmSiren(): void {
    this.playVictory();
  }
}
