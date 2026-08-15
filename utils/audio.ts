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

  playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Warm, crystalline celebratory fanfare
      const notes = [
        { f: 523.25, d: 0.18, t: 0, v: 0.22 },     // C5
        { f: 659.25, d: 0.18, t: 0.14, v: 0.24 },  // E5
        { f: 783.99, d: 0.20, t: 0.28, v: 0.26 },  // G5
        { f: 1046.5, d: 0.85, t: 0.44, v: 0.30 },  // C6
        { f: 1318.51, d: 1.2, t: 0.60, v: 0.28 },  // E6
        { f: 1567.98, d: 1.5, t: 0.76, v: 0.25 },  // G6 (Golden shimmer)
      ];

      notes.forEach((n) => {
        // Fundamental tone (warm sine)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);
        gain1.gain.setValueAtTime(0.0001, ctx.currentTime + n.t);
        gain1.gain.exponentialRampToValueAtTime(n.v, ctx.currentTime + n.t + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime + n.t);
        osc1.stop(ctx.currentTime + n.t + n.d + 0.05);

        // Harmonic overtone (bell clarity)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(n.f * 2, ctx.currentTime + n.t);
        gain2.gain.setValueAtTime(0.0001, ctx.currentTime + n.t);
        gain2.gain.exponentialRampToValueAtTime(n.v * 0.25, ctx.currentTime + n.t + 0.015);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d * 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + n.t);
        osc2.stop(ctx.currentTime + n.t + n.d * 0.65);
      });
    } catch {
      // Audio context fallback
    }
  }

  playAlarmSiren(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Harmonious golden bell fanfare for winner celebration & alert
      const fanfare = [
        { f: 587.33, t: 0, d: 0.22, v: 0.22 },     // D5
        { f: 739.99, t: 0.14, d: 0.24, v: 0.24 },  // F#5
        { f: 880.00, t: 0.28, d: 0.28, v: 0.26 },  // A5
        { f: 1174.66, t: 0.44, d: 1.4, v: 0.32 },  // D6 (Triumphant chord)
        { f: 1479.98, t: 0.48, d: 1.6, v: 0.26 },  // F#6
        { f: 1760.00, t: 0.52, d: 1.8, v: 0.20 },  // A6
      ];

      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

        // Smooth non-clicking attack and pleasant musical decay
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(n.v, ctx.currentTime + n.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.t);
        osc.stop(ctx.currentTime + n.t + n.d + 0.05);
      });
    } catch {
      // Audio context fallback
    }
  }
}
