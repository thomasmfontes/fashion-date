"use client";

import { type CSSProperties, useEffect, useState } from "react";
import LiveDrawAlert from "../live-draw-alert";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";

const CONFETTI_COLORS = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export default function SuccessPage() {
  const { savedParticipant: participant } = useSavedParticipant();
  const [celebrating, setCelebrating] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setCelebrating(false), 6500);
    return () => window.clearTimeout(timer);
  }, []);

  async function share() {
    const text = `Meu número da sorte no Fashion Date é ${participant?.luckyNumber ?? ""}`;
    if (navigator.share) {
      await navigator.share({ title: "Fashion Date", text });
    } else {
      await navigator.clipboard?.writeText(text);
    }
  }

  return (
    <main className="result-page result-success">
      {celebrating && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 42 }, (_, index) => (
            <i
              key={index}
              style={
                {
                  left: `${(index * 37) % 101}%`,
                  background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                  animationDelay: `-${(index % 11) * 0.19}s`,
                  animationDuration: `${3.3 + (index % 7) * 0.22}s`,
                  "--drift": `${(index % 2 ? 1 : -1) * (25 + (index % 55))}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <header className="result-brand">
        <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
        <span>Fashion Date · 2026</span>
      </header>
      <section className="result-content">
        <div className="result-kicker">
          <i /> Inscrição confirmada <i />
        </div>
        <h1>
          Você está<br />
          <em>participando.</em>
        </h1>
        <p className="result-intro">
          Seu número da sorte foi gerado e já está confirmado em nossa lista.
        </p>

        <article className="result-ticket">
          <div className="ticket-number-block">
            <span>Seu número da sorte</span>
            <strong>{participant?.luckyNumber ?? "----"}</strong>
          </div>
          <div className="ticket-person">
            <div>
              <span>Participante</span>
              <strong>{participant?.name ?? "Identificando..."}</strong>
            </div>
            <div>
              <span>Loja</span>
              <strong>{participant?.store ?? "—"}</strong>
            </div>
          </div>
        </article>

        <p className="result-reminder">
          <span className="material-symbols-outlined">photo_camera</span> Tire
          um print e guarde seu número.
        </p>
        <div className="result-actions">
          <button
            className="result-primary"
            type="button"
            onClick={() => window.print()}
          >
            <span className="material-symbols-outlined">download</span> Salvar
            comprovante
          </button>
          <button className="result-secondary" type="button" onClick={share}>
            <span className="material-symbols-outlined">share</span>{" "}
            Compartilhar
          </button>
        </div>
        <div className="result-actions single">
          <a className="result-secondary" href="/">
            <span className="material-symbols-outlined">add</span> Cadastrar
            outro participante
          </a>
        </div>
        <LiveDrawAlert luckyNumber={String(participant?.luckyNumber ?? "")} />
        <footer className="result-note">
          <span>Apresente este comprovante se for sorteado.</span>
          <strong>Boa sorte!</strong>
        </footer>
      </section>
    </main>
  );
}
