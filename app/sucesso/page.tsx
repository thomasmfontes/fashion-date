"use client";

import { type CSSProperties, useEffect, useState } from "react";
import LiveDrawAlert from "../live-draw-alert";
import { useParticipantWallet } from "@/hooks/useParticipantWallet";
import {
  USER_TYPE_LABELS,
  USER_TYPE_ICONS,
  type UserType,
} from "@/types/participant.types";
import type { DrawItem } from "@/types/drawCollection.types";
import "./wallet.css";

const CONFETTI_COLORS = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export default function SuccessPage() {
  const {
    savedParticipant: participant,
    tickets,
    eligibleDraws,
    hasTicket,
    getTicket,
    enterDraw,
  } = useParticipantWallet();

  const [celebrating, setCelebrating] = useState(true);
  const [claimingDrawId, setClaimingDrawId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setCelebrating(false), 6500);
    return () => window.clearTimeout(timer);
  }, []);

  async function share() {
    const ticketSummary = tickets
      .map((t) => `${t.drawTitle}: Nº ${t.ticketNumber}`)
      .join("\n");
    const text = `Meus números da sorte no Fashion Date 2026:\n${ticketSummary}`;
    if (navigator.share) {
      await navigator.share({ title: "Fashion Date", text });
    } else {
      await navigator.clipboard?.writeText(text);
      alert("Comprovante copiado para a área de transferência!");
    }
  }

  async function handleClaimDraw(draw: DrawItem) {
    setClaimingDrawId(draw.id);
    try {
      await enterDraw(draw);
    } finally {
      setClaimingDrawId(null);
    }
  }

  const userType: UserType = participant?.userType || "lojista";
  const userTypeLabel = USER_TYPE_LABELS[userType] || "Lojista";
  const userTypeIcon = USER_TYPE_ICONS[userType] || "storefront";

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

      <section className="result-content" style={{ maxWidth: "800px" }}>
        <div className="result-kicker">
          <i /> Carteira Oficial do Participante <i />
        </div>

        <h1>
          Minha Carteira<br />
          <em>de Sorteios</em>
        </h1>

        <p className="result-intro">
          Seus bilhetes oficiais e sorteios disponíveis para o seu perfil no evento.
        </p>

        {/* Profile Card Header */}
        <div className="wallet-profile-bar">
          <div className="wallet-profile-info">
            <div className="wallet-avatar-icon">
              <span className="material-symbols-outlined">{userTypeIcon}</span>
            </div>
            <div className="wallet-profile-text">
              <strong>{participant?.name || "Participante"}</strong>
              <span>
                {participant?.store && participant.store !== "—"
                  ? participant.store
                  : participant?.instagram || "Fashion Date 2026"}
              </span>
            </div>
          </div>

          <div className="wallet-profile-badge">
            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
              {userTypeIcon}
            </span>
            <span>{userTypeLabel}</span>
          </div>
        </div>

        {/* Section: Sorteios Disponíveis e Bilhetes */}
        <div className="wallet-section-title">
          <h2>Sorteios Disponíveis no Evento</h2>
          <p>
            Clique em <strong>Quero Concorrer</strong> nos sorteios que deseja participar para gerar seu bilhete.
          </p>
        </div>

        <div className="wallet-cards-grid">
          {eligibleDraws.map((draw) => {
            const isEntered = hasTicket(draw.id);
            const ticket = getTicket(draw.id);
            const isClaiming = claimingDrawId === draw.id;

            return (
              <article
                key={draw.id}
                className={`wallet-card${isEntered ? " claimed" : ""}`}
              >
                <div className="wallet-card-header">
                  <div className="wallet-card-tags">
                    <span className={`wallet-card-tag ${isEntered ? "success" : "gold"}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                        {isEntered ? "verified" : "star"}
                      </span>
                      {isEntered ? "Inscrito no Sorteio" : "Disponível para Você"}
                    </span>

                    {draw.hasNumberLimit && draw.maxNumber && (
                      <span className="wallet-card-tag">
                        Até Nº {String(draw.maxNumber).padStart(4, "0")}
                      </span>
                    )}
                  </div>

                  {isEntered && (
                    <span className="stitch-status open" style={{ padding: "4px 8px", fontSize: "11px" }}>
                      Concorrendo
                    </span>
                  )}
                </div>

                <h3 className="wallet-card-title">{draw.title}</h3>
                <div className="wallet-card-prize">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  <span>Prêmio: <strong>{draw.prizeTitle}</strong></span>
                </div>

                {isEntered && ticket ? (
                  <div className="wallet-ticket-badge-box">
                    <div className="wallet-ticket-label">
                      <span>Seu Número da Sorte</span>
                    </div>
                    <div className="wallet-ticket-number">
                      <span>#{ticket.ticketNumber}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="wallet-claim-btn"
                    onClick={() => handleClaimDraw(draw)}
                    disabled={isClaiming}
                  >
                    {isClaiming ? (
                      <>
                        <span className="button-spinner" />
                        <span>Gerando Bilhete...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">confirmation_number</span>
                        <span>Quero Concorrer Neste Sorteio</span>
                      </>
                    )}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <p className="result-reminder">
          <span className="material-symbols-outlined">photo_camera</span> Tire um print desta tela para guardar seus números.
        </p>

        <div className="result-actions">
          <button
            className="result-primary"
            type="button"
            onClick={() => window.print()}
          >
            <span className="material-symbols-outlined">download</span> Salvar Comprovante
          </button>
          <button className="result-secondary" type="button" onClick={share}>
            <span className="material-symbols-outlined">share</span> Compartilhar
          </button>
        </div>

        <LiveDrawAlert luckyNumber={String(participant?.luckyNumber ?? "")} />

        <footer className="result-note">
          <span>Apresente seu comprovante se for sorteado no telão oficial.</span>
          <strong>Boa sorte!</strong>
        </footer>
      </section>
    </main>
  );
}
