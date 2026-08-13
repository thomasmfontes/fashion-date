"use client";
import { useEffect, useState } from "react";

type Participant = { luckyNumber: string; name: string; store: string };

export default function SuccessPage() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  useEffect(() => {
    const saved = sessionStorage.getItem("fashion-date-participant");
    if (saved) setParticipant(JSON.parse(saved));
  }, []);
  return <main className="center-page"><section className="success-wrap">
    <div className="success-icon">★</div>
    <h1 className="display">Cadastro realizado!</h1>
    <p className="success-subtitle">Este é o seu número da sorte:</p>
    <div className="ticket"><strong className="lucky-number">{participant?.luckyNumber ?? "----"}</strong><hr /><div className="ticket-label">Participante</div><h2>{participant?.name ?? "Carregando..."}</h2><div className="ticket-label">Loja</div><p>{participant?.store}</p></div>
    <p className="success-subtitle"><em>Tire um print desta tela e guarde seu número.</em></p>
    <div className="action-stack"><button className="primary-button" onClick={() => window.print()}>SALVAR MEU NÚMERO</button><button className="secondary-button" onClick={() => navigator.share?.({ title:"Meu número Fashion Date", text:`Meu número da sorte é ${participant?.luckyNumber}` })}>COMPARTILHAR</button></div>
    <p className="success-note">O sorteio será realizado durante o Fashion Date 2026.<br /><strong style={{color:"var(--gold)"}}>Boa sorte!</strong></p>
  </section></main>;
}
