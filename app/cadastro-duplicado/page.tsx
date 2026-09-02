"use client";

import LiveDrawAlert from "../live-draw-alert";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";

export default function DuplicatePage() {
  const { savedParticipant: participant } = useSavedParticipant();

  return (
    <main className="result-page result-duplicate">
      <header className="result-brand">
        <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
        <span>Fashion Date · 2026</span>
      </header>
      <section className="result-content">
        <div className="result-kicker">
          <i /> Cadastro localizado <i />
        </div>
        <h1>
          Você já está<br />
          <em>na nossa lista.</em>
        </h1>
        <p className="result-intro">
          Este WhatsApp já possui uma inscrição. Fique tranquilo: seu número
          continua válido para o sorteio.
        </p>

        <article className="result-ticket duplicate-ticket">
          <div className="ticket-number-block">
            <span>Seu número da sorte</span>
            <strong>{participant?.luckyNumber ?? "----"}</strong>
          </div>
          <div className="ticket-person">
            <div>
              <span>Participante</span>
              <strong>{participant?.name ?? "Cadastro confirmado"}</strong>
            </div>
            <div>
              <span>Loja</span>
              <strong>{participant?.store ?? "—"}</strong>
            </div>
          </div>
        </article>

        <div className="duplicate-message">
          <span className="material-symbols-outlined">verified</span>
          <div>
            <strong>Nenhum novo cadastro foi criado</strong>
            <p>Use o número acima no dia do evento.</p>
          </div>
        </div>
        <div className="result-actions single">
          <a className="result-primary" href="/sucesso">
            <span>Acessar Minha Carteira de Sorteios</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
        <LiveDrawAlert luckyNumber={String(participant?.luckyNumber ?? "")} />
        <footer className="result-note">
          <span>Nos vemos no Fashion Date 2026.</span>
          <strong>Boa sorte!</strong>
        </footer>
      </section>
    </main>
  );
}
