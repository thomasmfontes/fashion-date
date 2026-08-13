"use client";

import {CSSProperties, useCallback, useEffect, useRef, useState} from "react";

type LiveDrawAlertProps = {luckyNumber?: string};
type WakeLockLike = {release(): Promise<void>};
type WakeNavigator = Navigator & {wakeLock?: {request(type:"screen"): Promise<WakeLockLike>}};

const colors = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export default function LiveDrawAlert({luckyNumber}: LiveDrawAlertProps) {
  const [enabled, setEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [celebration, setCelebration] = useState<"test" | "winner" | null>(null);
  const lastDraw = useRef<string | null>(null);
  const wakeLock = useRef<WakeLockLike | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const testTimer = useRef<number | null>(null);

  const playVictory = useCallback(async () => {
    try {
      const Audio = window.AudioContext || (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
      if (!Audio) return;
      const context = audio.current || new Audio();
      audio.current = context;
      await context.resume();
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * .13;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(.22, start + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .34);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + .36);
      });
    } catch {}
  }, []);

  const celebrate = useCallback((mode:"test" | "winner") => {
    setCelebration(mode);
    playVictory();
    navigator.vibrate?.([250, 110, 250, 110, 500]);
    if (testTimer.current) window.clearTimeout(testTimer.current);
    if (mode === "test") testTimer.current = window.setTimeout(() => setCelebration(null), 4200);
  }, [playVictory]);

  const requestWakeLock = useCallback(async () => {
    try { wakeLock.current = await (navigator as WakeNavigator).wakeLock?.request("screen") || null; } catch {}
  }, []);

  const checkDraw = useCallback(async (baseline = false) => {
    if (!luckyNumber) return;
    try {
      const response = await fetch(`/api/live-draw?t=${Date.now()}`, {cache:"no-store"});
      if (!response.ok) throw new Error();
      const data = await response.json() as {drawId:string | null; winnerNumber:string | null};
      setConnected(true);
      if (baseline) { lastDraw.current = data.drawId; return; }
      if (data.drawId && data.drawId !== lastDraw.current) {
        lastDraw.current = data.drawId;
        if (data.winnerNumber === luckyNumber) celebrate("winner");
      }
    } catch { setConnected(false); }
  }, [celebrate, luckyNumber]);

  async function enable() {
    await playVictory();
    await requestWakeLock();
    await checkDraw(true);
    setEnabled(true);
  }

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => checkDraw(), 2500);
    const visibility = () => { if (document.visibilityState === "visible") { requestWakeLock(); checkDraw(); } };
    document.addEventListener("visibilitychange", visibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", visibility); };
  }, [checkDraw, enabled, requestWakeLock]);

  useEffect(() => () => {
    if (testTimer.current) window.clearTimeout(testTimer.current);
    wakeLock.current?.release();
    navigator.vibrate?.(0);
  }, []);

  return <>
    <section className={`live-alert-card${enabled ? " is-enabled" : ""}`}>
      <div className="live-alert-icon"><span className="material-symbols-outlined">notifications_active</span></div>
      <div className="live-alert-copy"><span>Sorteio ao vivo</span><h2>{enabled ? "Seu alerta está ativado" : "Receba o resultado no celular"}</h2><p>{enabled ? "Mantenha esta página aberta. Avisaremos se este número for sorteado." : "Ative som, vibração, confetes e mantenha a tela acordada durante o sorteio."}</p></div>
      <div className="live-alert-actions">{enabled ? <><span className={`live-connection${connected ? " online" : ""}`}><i/>{connected ? "Conectado" : "Reconectando"}</span><button onClick={() => celebrate("test")}><span className="material-symbols-outlined">campaign</span>Testar alerta</button></> : <button className="activate" onClick={enable} disabled={!luckyNumber}><span className="material-symbols-outlined">power_settings_new</span>Ativar alerta</button>}</div>
    </section>

    {celebration && <div className={`live-winner-overlay ${celebration}`} role="status" aria-live="assertive">
      <div className="live-screen-flash"/>
      <div className="live-confetti" aria-hidden="true">{Array.from({length:48}, (_, index) => <i key={index} style={{left:`${(index * 37) % 101}%`, background:colors[index % colors.length], animationDelay:`-${(index % 11) * .14}s`, animationDuration:`${2.8 + (index % 7) * .22}s`, "--drift":`${(index % 2 ? 1 : -1) * (25 + index % 60)}px`} as CSSProperties}/>)}</div>
      <div className="live-winner-content">
        <header className="live-winner-brand">
          <img src="/fashiondate-logo.png" alt="Fashion Date"/>
          <span>Fashion Date · 2026</span>
        </header>
        <div className="live-winner-kicker"><i/>{celebration === "winner" ? "Resultado ao vivo" : "Teste do alerta"}<i/></div>
        <h2>{celebration === "winner" ? "Você ganhou!" : "Tudo pronto!"}</h2>
        <div className="live-winning-ticket">
          <span>{celebration === "winner" ? "Número vencedor" : "Seu número da sorte"}</span>
          <strong>{luckyNumber || "----"}</strong>
        </div>
        <p>{celebration === "winner" ? "Parabéns! Apresente esta tela à organização do evento para receber seu prêmio." : "Quando o seu número for sorteado, esta celebração aparecerá automaticamente no seu celular."}</p>
        {celebration === "test" ? <button onClick={() => setCelebration(null)}>Fechar teste</button> : <span className="live-winner-note">Procure a equipe Fashion Date</span>}
      </div>
    </div>}
  </>;
}
