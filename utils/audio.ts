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

  playVictoryFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Triumphant Haute Couture fanfare chime (C5, E5, G5, C6, E6)
      const notes = [
        { freq: 523.25, time: 0, dur: 0.22, gain: 0.16 },
        { freq: 659.25, time: 0.1, dur: 0.22, gain: 0.18 },
        { freq: 783.99, time: 0.2, dur: 0.26, gain: 0.2 },
        { freq: 1046.5, time: 0.35, dur: 0.85, gain: 0.24 },
        { freq: 1318.51, time: 0.48, dur: 0.95, gain: 0.18 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + note.time);
        gain.gain.linearRampToValueAtTime(note.gain, ctx.currentTime + note.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + note.time);
        osc.stop(ctx.currentTime + note.time + note.dur + 0.05);
      });
    } catch {
      // Audio context fallback
    }
  }

  /**
   * Toca exclusivamente o chime suave de sucesso ao garantir um número da sorte.
   * Não toca o áudio do vencedor (/sounds/victory.mp3), mantendo a comemoração
   * leve e agradável sem confundir com a tela de vencedor oficial.
   */
  playSuccessChime(): void {
    if (this.isMuted) return;
    this.playVictoryFanfare();
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

    // Toca exclusivamente o áudio oficial do vencedor (/sounds/victory.mp3)
    const audio = this.getVictoryAudio();
    if (audio && typeof audio.play === "function") {
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch((err) => {
            console.warn("Victory mp3 playback error:", err);
          });
        }
      } catch (err) {
        console.warn("Victory mp3 playback error:", err);
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
