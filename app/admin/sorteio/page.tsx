"use client";

import { useEffect, useRef, useState } from "react";

type Winner = {id:number; luckyNumber:string; name:string; store:string; instagram:string};

export default function DrawPage() {
  const [key, setKey] = useState("");
  const [number, setNumber] = useState("0000");
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setKey(sessionStorage.getItem("fashion-date-admin-key") || "");
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  async function draw() {
    if (!key) { location.href = "/admin"; return; }
    setWinner(null);
    setRunning(true);
    timer.current = setInterval(() => setNumber(String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")), 70);
    await new Promise(resolve => setTimeout(resolve, 2600));
    const response = await fetch("/api/admin/draw", {method:"POST", headers:{"x-admin-key":key}});
    const data = await response.json();
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
    if (response.ok) {
      setWinner(data.winner);
      setNumber(data.winner.luckyNumber);
    } else {
      alert(data.error || "Não foi possível realizar o sorteio.");
    }
  }

  return <main className={`draw-page${running ? " is-running" : ""}${winner ? " has-winner" : ""}`}>
    <div className="draw-backdrop" aria-hidden="true"><i/><i/><i/></div>

    <header className="draw-header">
      <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic"/>
      <div className="draw-event-title">
        <span><i/> Sorteio ao vivo</span>
        <h1>Provador Fashion</h1>
      </div>
    </header>

    {winner ? <section className="winner-panel" aria-live="polite">
      <div className="winner-emblem"><span className="material-symbols-outlined">workspace_premium</span></div>
      <p className="draw-overline">O número sorteado foi</p>
      <strong className="lucky-number">{winner.luckyNumber}</strong>
      <div className="winner-divider"><span/></div>
      <p className="winner-announcement">Temos um vencedor!</p>
      <h2 className="winner-name">{winner.name}</h2>
      <div className="winner-meta">
        <span><b className="material-symbols-outlined">storefront</b>{winner.store}</span>
        <a href={`https://instagram.com/${winner.instagram.replace(/^@+/, "")}`} target="_blank" rel="noreferrer"><img className="winner-instagram-icon" src="https://cdn.simpleicons.org/instagram/9B702B" alt=""/>@{winner.instagram.replace(/^@+/, "")}</a>
      </div>
      <div className="winner-actions">
        <button className="admin-button" onClick={() => {setWinner(null); setNumber("0000");}}><span className="material-symbols-outlined">refresh</span>Novo sorteio</button>
        <a className="admin-button primary" href="/admin/vencedores"><span className="material-symbols-outlined">emoji_events</span>Ver vencedores</a>
      </div>
    </section> : <section className="draw-stage">
      <div className="draw-status"><i/>{running ? "Sorteando agora" : "Tudo pronto para começar"}</div>
      <div className="draw-card">
        <p>{running ? "O número da sorte está chegando" : "Número da sorte"}</p>
        <div className="draw-number" aria-live="polite">{number}</div>
        <div className="draw-line"><span/></div>
        <strong>{running ? "Aguarde a revelação" : "Boa sorte a todos"}</strong>
      </div>
      <div className="draw-controls">
        <button className="primary-button" onClick={draw} disabled={running}><span className="material-symbols-outlined">casino</span>{running ? "Sorteando..." : "Sortear agora"}</button>
        <a className="back-link" href="/admin"><span className="material-symbols-outlined">arrow_back</span>Voltar ao painel</a>
      </div>
    </section>}
  </main>;
}
