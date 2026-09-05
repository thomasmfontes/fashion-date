"use client";

import type { SavedParticipant } from "@/types/participant.types";
import type { DrawItem } from "@/types/drawCollection.types";
import type { ParticipantTicket } from "@/types/participant.types";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { formatName } from "@/utils/formatters";

interface HomeTabProps {
  participant: SavedParticipant | null;
  tickets: ParticipantTicket[];
  eligibleDraws: DrawItem[];
  onNavigate: (tab: "home" | "tickets" | "live" | "profile") => void;
}

export function HomeTab({
  participant,
  tickets,
  eligibleDraws,
  onNavigate,
}: HomeTabProps) {
  const { registrationsOpen } = useAuthGuard();
  const firstName = participant?.name
    ? formatName(participant.name.trim().split(" ")[0])
    : "Participante";

  return (
    <>
      {/* 1. Cabeçalho Padronizado Stitch */}
      <header className="stitch-header">
        <div>
          <h1>Olá, {firstName}!</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            <span
              className={`stitch-status ${registrationsOpen ? "open" : "closed"}`}
              role="status"
              aria-live="polite"
            >
              <i />
              Inscrições {registrationsOpen ? "Abertas" : "Encerradas"}
            </span>
          </div>
        </div>

        <div className="stitch-actions">
          <button
            type="button"
            className="stitch-button filled"
            onClick={() => onNavigate("live")}
          >
            <span className="material-symbols-outlined">live_tv</span>
            <span>Acompanhar Telão</span>
          </button>
        </div>
      </header>

      {/* 2. Cards de Métricas (Visão Rápida no Topo) */}
      <div className="stitch-stats stitch-draw-stats">
        <div
          className="stitch-stat-card"
          onClick={() => onNavigate("tickets")}
          style={{ cursor: "pointer", transition: "transform 0.16s ease" }}
          title="Ver Meus Números da Sorte"
        >
          <div className="stat-header">
            <span className="stat-label">Meus Números da Sorte</span>
            <div className="stat-icon-badge">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
          </div>
          <strong className="stat-value">{tickets.length}</strong>
        </div>

        <div
          className="stitch-stat-card"
          onClick={() => onNavigate("tickets")}
          style={{ cursor: "pointer", transition: "transform 0.16s ease" }}
          title="Ver Sorteios Disponíveis"
        >
          <div className="stat-header">
            <span className="stat-label">Sorteios do Evento</span>
            <div className="stat-icon-badge">
              <span className="material-symbols-outlined">tune</span>
            </div>
          </div>
          <strong className="stat-value">{eligibleDraws.length}</strong>
        </div>
      </div>

      {/* 3. Painel Principal Padronizado (Haute Couture Wallet Grid) */}
      <div className="stitch-panel-card">
        <div className="stitch-controls-header">
          <div className="stitch-header-info">
            <div className="stitch-header-pill">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span>Seus Números</span>
              <span className="stitch-pill-count">{tickets.length}</span>
            </div>
          </div>

          <div className="stitch-controls-meta">
            <button
              type="button"
              className="stitch-export-btn"
              onClick={() => onNavigate("tickets")}
              title="Gerenciar todos os sorteios do evento"
            >
              <span className="export-text">Ver todos os sorteios</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9a741a" }}>
                arrow_forward
              </span>
            </button>
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          {tickets.length > 0 ? (
            <>
              <div className="stitch-wallet-grid">
                {tickets.map((t) => (
                  <article key={t.drawId} className="stitch-wallet-ticket">
                    <div>
                      <div className="stitch-wallet-ticket-top">
                        <span className="stitch-wallet-ticket-kicker">
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#c79a36" }}>
                            confirmation_number
                          </span>
                          <span>Número da Sorte</span>
                        </span>
                        <span className="stitch-status open" style={{ padding: "2px 8px", fontSize: "10px" }}>
                          <i /> Ativo
                        </span>
                      </div>

                      <div className="stitch-wallet-ticket-badge-box">
                        <div className="stitch-wallet-ticket-num">
                          <span className="hash">#</span>
                          <span>{t.ticketNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="stitch-ticket-perforation" />
                      <div className="stitch-wallet-ticket-draw">{t.drawTitle}</div>
                      <div className="stitch-wallet-ticket-prize">
                        <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#9a741a" }}>
                          workspace_premium
                        </span>
                        <span>Prêmio: <strong>{t.prizeTitle || t.drawTitle}</strong></span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {eligibleDraws.length > tickets.length && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #fdf9f0 0%, #faecd0 100%)",
                    border: "1px solid #ebd499",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#9a741a" }}>
                      tune
                    </span>
                    <div>
                      <strong style={{ display: "block", color: "#530017", fontSize: "13.5px" }}>
                        Existem novos sorteios disponíveis para você participar!
                      </strong>
                      <span style={{ fontSize: "12.5px", color: "#6d5b5d" }}>
                        Garanta seu número da sorte antes que as inscrições sejam encerradas.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="stitch-button filled"
                    style={{ fontSize: "11px", padding: "0 16px", minHeight: "38px" }}
                    onClick={() => onNavigate("tickets")}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                      confirmation_number
                    </span>
                    <span>Garantir Número</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 20px" }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "42px", color: "#9a741a", marginBottom: "8px" }}
              >
                confirmation_number
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-fashion, serif)",
                  color: "#530017",
                  fontSize: "18px",
                  margin: "0 0 6px",
                }}
              >
                Você ainda não garantiu seus números da sorte
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "#786568" }}>
                Confirme sua participação nos sorteios disponíveis para concorrer aos prêmios oficiais do evento.
              </p>
              <button
                type="button"
                className="stitch-button filled"
                onClick={() => onNavigate("tickets")}
              >
                <span className="material-symbols-outlined">confirmation_number</span>
                <span>Garantir Meus Números</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
