"use client";

import { type CSSProperties } from "react";
import type { SavedParticipant } from "@/types/participant.types";
import type { ParticipantTicket } from "@/types/participant.types";
import { useLiveAlert } from "@/hooks/useLiveAlert";

interface LiveTabProps {
  participant: SavedParticipant | null;
  tickets: ParticipantTicket[];
}

const CONFETTI_COLORS = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export function LiveTab({ participant, tickets }: LiveTabProps) {
  // Coleta os números da sorte do participante
  const luckyNumbers =
    tickets.length > 0
      ? tickets.map((t) => t.ticketNumber)
      : participant?.luckyNumber
        ? [String(participant.luckyNumber)]
        : [];

  const primaryNumber = luckyNumbers[0] || "";

  const {
    isEnabled,
    celebration,
    alarmActive,
    drawnNumber,
    winningTicket,
    activeDrawTitle,
    activePrizeTitle,
    enableAlert,
    silenceAlarm,
    dismissCelebration,
    triggerTest,
  } = useLiveAlert(tickets.length > 0 ? tickets : luckyNumbers);

  return (
    <>
      {/* 1. Cabeçalho Padronizado Stitch */}
      <header className="stitch-header">
        <div>
          <h1>Telão Sorteio</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            <span className="stitch-status open" role="status" aria-live="polite">
              <i /> {isEnabled ? "Alerta Ativado no Aparelho" : "Sincronizado ao Vivo"}
            </span>
          </div>
        </div>

        {/* Ação Primária no Cabeçalho Oficial */}
        <div className="stitch-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="stitch-button outline"
            onClick={triggerTest}
            title="Testar som e celebração no aparelho"
          >
            <span className="material-symbols-outlined">volume_up</span>
            <span>Testar Alerta</span>
          </button>
          {!isEnabled && (
            <button
              type="button"
              className="stitch-button filled"
              onClick={enableAlert}
              title="Ativar som e vibração no aparelho"
            >
              <span className="material-symbols-outlined">notifications_active</span>
              <span>Ativar Alerta</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Painel Principal Padronizado (Sem fragmentação de múltiplos cards) */}
      <div className="stitch-panel-card">
        <div className="stitch-controls-header">
          <div className="stitch-header-info">
            <div className="stitch-header-pill">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span>Seus Números</span>
              <span className="stitch-pill-count">{tickets.length}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "clamp(14px, 3.5vw, 24px)" }}>
          {/* Instrução única, concisa e direta ao ponto */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              borderRadius: "10px",
              background: isEnabled ? "#fbf8f2" : "#fdfbf8",
              border: isEnabled ? "1px solid #ebd499" : "1px solid #ebdcc5",
              marginBottom: "20px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px", color: isEnabled ? "#9a741a" : "#786568", flexShrink: 0 }}
            >
              {isEnabled ? "notifications_active" : "info"}
            </span>
            <p style={{ margin: 0, fontSize: "13px", color: "#5a474a", lineHeight: "1.45" }}>
              {isEnabled
                ? "Mantenha esta tela aberta durante os sorteios. Se qualquer um dos seus números abaixo for sorteado, seu aparelho te avisará instantaneamente!"
                : "Toque em “Ativar Alerta” no topo para permitir que seu celular te avise no momento exato em que seu número for sorteado"}
            </p>
          </div>

          {/* Números da Sorte Concorrendo no Telão */}
          {tickets.length > 0 ? (
            <div className="stitch-wallet-grid">
              {[...tickets]
                .sort((a, b) => {
                  const aClean = a.ticketNumber.replace(/\D/g, "");
                  const bClean = b.ticketNumber.replace(/\D/g, "");
                  const aWin = Boolean(a.isWinner) || (winningTicket && winningTicket.ticketNumber.replace(/\D/g, "") === aClean);
                  const bWin = Boolean(b.isWinner) || (winningTicket && winningTicket.ticketNumber.replace(/\D/g, "") === bClean);
                  if (aWin !== bWin) return aWin ? -1 : 1;
                  const aExp = Boolean(a.isExpired);
                  const bExp = Boolean(b.isExpired);
                  if (aExp !== bExp) return aExp ? 1 : -1;
                  return 0;
                })
                .map((t) => {
                  const cleanTicketNum = t.ticketNumber.replace(/\D/g, "");
                  const isTicketWinner =
                    Boolean(t.isWinner) ||
                    (winningTicket &&
                      winningTicket.ticketNumber.replace(/\D/g, "") === cleanTicketNum &&
                      (!winningTicket.drawId || !t.drawId || winningTicket.drawId === t.drawId)) ||
                    (celebration === "winner" &&
                      drawnNumber.replace(/\D/g, "") === cleanTicketNum);
                  const isTicketExpired = Boolean(t.isExpired) && !isTicketWinner;

                  return (
                    <article
                      key={t.drawId}
                      className={`stitch-wallet-ticket${isTicketWinner ? " is-winner" : isTicketExpired ? " is-expired" : ""}`}
                      style={isTicketExpired ? { pointerEvents: "none", cursor: "default", transform: "none", transition: "none" } : undefined}
                    >
                      <div>
                        {isTicketWinner ? (
                          <div className="stitch-wallet-ticket-top is-winner">
                            <div className="stitch-wallet-ticket-winner-header">
                              <span className="stitch-gold-filigree-line left" aria-hidden="true" />
                              <div className="stitch-wallet-ticket-badge-contemplado-center">
                                <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#ffd778" }}>
                                  workspace_premium
                                </span>
                                <span>Número Contemplado</span>
                              </div>
                              <span className="stitch-gold-filigree-line right" aria-hidden="true" />
                            </div>
                          </div>
                        ) : (
                          <div className="stitch-wallet-ticket-top">
                            <span className="stitch-wallet-ticket-kicker">
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "16px", color: isTicketExpired ? "#9c938b" : "#c79a36" }}
                              >
                                confirmation_number
                              </span>
                              <span>Número da Sorte</span>
                            </span>

                            {isTicketExpired ? (
                              <span className="stitch-status expired" style={{ padding: "2px 8px", fontSize: "10px" }}>
                                <i /> Encerrado
                              </span>
                            ) : (
                              <span className="stitch-status open" style={{ padding: "2px 8px", fontSize: "10px" }}>
                                <i /> Ativo
                              </span>
                            )}
                          </div>
                        )}

                      {/* Selo Central Majestoso do Número */}
                      <div className="stitch-wallet-ticket-badge-box">
                        <div className="stitch-wallet-ticket-num">
                          <span className="hash" style={isTicketExpired ? { color: "#9c938b" } : undefined}>#</span>
                          <span style={isTicketExpired ? { color: "#706863" } : undefined}>{t.ticketNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="stitch-ticket-perforation" />
                      <div className="stitch-wallet-ticket-draw" style={isTicketExpired ? { color: "#635b57" } : undefined}>{t.drawTitle}</div>
                      <div className="stitch-wallet-ticket-prize">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "15px", color: isTicketExpired ? "#9c938b" : "#9a741a" }}
                        >
                          workspace_premium
                        </span>
                        <span>Prêmio: <strong style={isTicketExpired ? { color: "#635b57" } : undefined}>{t.prizeTitle || t.drawTitle}</strong></span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 20px" }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#9a741a", marginBottom: "8px" }}
              >
                confirmation_number
              </span>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#332225",
                  fontFamily: "var(--font-fashion, serif)",
                }}
              >
                Nenhum número da sorte ativo no momento
              </h3>
              <p style={{ margin: "0 auto", color: "#6d5b5d", fontSize: "13.5px", maxWidth: "420px" }}>
                Você ainda não garantiu participação nos sorteios oficiais. Acesse a aba Números da Sorte para confirmar sua vaga.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Overlay Oficial de Celebração de Vitória (Disparado em Tempo Real) */}
      {celebration && (
        <div
          className={`live-winner-overlay ${celebration}${alarmActive ? " is-alarming" : " is-silenced"}`}
          role="status"
          aria-live="assertive"
        >
          <div className="live-screen-flash" />
          {celebration !== "not-winner" && (
            <div className="live-confetti" aria-hidden="true">
              {Array.from({ length: 48 }, (_, index) => (
                <i
                  key={index}
                  style={
                    {
                      left: `${(index * 37) % 101}%`,
                      background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                      animationDelay: `-${(index % 11) * 0.14}s`,
                      animationDuration: `${2.8 + (index % 7) * 0.22}s`,
                      "--drift": `${(index % 2 ? 1 : -1) * (25 + (index % 60))}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}

          {(() => {
            const isNotWinner = celebration === "not-winner";

            return (
              <div className="live-winner-content">
                <header className="live-winner-brand" style={{ marginBottom: "8px" }}>
                  <img
                    src="/fashiondate-logo.png"
                    alt="Fashion Date Crente Chic"
                    style={{
                      filter: isNotWinner
                        ? "none"
                        : "brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0,0,0,0.5))",
                      opacity: 0.96,
                    }}
                  />
                  <span
                    style={{
                      color: isNotWinner ? "#786568" : "#e7c275",
                      letterSpacing: "0.22em",
                      marginTop: "4px",
                      fontWeight: 700,
                      fontSize: "11px",
                    }}
                  >
                    7ª EDIÇÃO &middot; CRENTE CHIC
                  </span>
                </header>

                <div className="live-winner-kicker" style={{ marginTop: "14px", marginBottom: "8px" }}>
                  <i style={{ width: "32px", height: "1px", background: isNotWinner ? "rgba(154,116,26,0.35)" : "rgba(231,194,117,0.7)" }} />
                  <span
                    style={{
                      color: isNotWinner ? "#855e09" : "#e7c275",
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      fontWeight: 700,
                    }}
                  >
                    {celebration === "winner"
                      ? (activeDrawTitle ? activeDrawTitle.toUpperCase() : "SORTEIO OFICIAL")
                      : isNotWinner
                        ? (activeDrawTitle ? activeDrawTitle.toUpperCase() : "SORTEIO REALIZADO")
                        : "TESTE DO ALERTA"}
                  </span>
                  <i style={{ width: "32px", height: "1px", background: isNotWinner ? "rgba(154,116,26,0.35)" : "rgba(231,194,117,0.7)" }} />
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-fashion, "Playfair Display", Georgia, serif)',
                    color: isNotWinner ? "#530017" : "#fff7e8",
                    fontSize: "clamp(38px, 8.5vw, 68px)",
                    fontWeight: 600,
                    lineHeight: 1.1,
                    margin: "8px 0 14px",
                    letterSpacing: "-0.02em",
                    textShadow: isNotWinner ? "none" : "0 3px 16px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  {celebration === "winner"
                    ? "Você ganhou!"
                    : isNotWinner
                      ? "Não foi dessa vez"
                      : "Tudo pronto!"}
                </h2>

                {/* Subtítulo do Prêmio quando o usuário for contemplado */}
                {celebration === "winner" && (activePrizeTitle || activeDrawTitle) && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 14px",
                      borderRadius: "999px",
                      background: "rgba(231, 194, 117, 0.16)",
                      border: "1px solid rgba(231, 194, 117, 0.4)",
                      color: "#f3d48d",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "16px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#f3d48d" }}>
                      workspace_premium
                    </span>
                    <span>
                      Prêmio: <strong>{activePrizeTitle || activeDrawTitle}</strong>
                    </span>
                  </div>
                )}

                <div
                  className="live-winning-ticket"
                  style={
                    isNotWinner
                      ? {
                          background: "#ffffff",
                          borderColor: "#ebdcc5",
                          boxShadow: "0 14px 40px rgba(67, 0, 20, 0.08)",
                        }
                      : undefined
                  }
                >
                  <span
                    style={{
                      display: "block",
                      color: isNotWinner ? "#855e09" : "rgba(255, 247, 232, 0.72)",
                      fontSize: isNotWinner ? "11.5px" : "11px",
                      fontWeight: 700,
                      letterSpacing: isNotWinner ? "0.12em" : "0.16em",
                      textTransform: "uppercase",
                      marginBottom: isNotWinner ? "6px" : "4px",
                      textShadow: isNotWinner ? "none" : undefined,
                    }}
                  >
                    {isNotWinner
                      ? "Número Sorteado"
                      : celebration === "winner"
                        ? "Número Sorteado"
                        : "Seu Número da Sorte"}
                  </span>
                  <strong
                    style={{
                      fontFamily: '"Bodoni Moda", "Cinzel", Georgia, serif',
                      fontVariantNumeric: "lining-nums tabular-nums",
                      fontFeatureSettings: '"lnum" 1, "tnum" 1',
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                      display: "inline-flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                      color: isNotWinner ? "#530017" : undefined,
                      textShadow: isNotWinner ? "none" : undefined,
                    }}
                  >
                    {(() => {
                      const rawNum =
                        isNotWinner
                          ? drawnNumber
                          : (winningTicket?.ticketNumber || primaryNumber);
                      if (!rawNum) return "----";
                      const cleanNum = rawNum.replace(/^#/, "");
                      return (
                        <>
                          <span
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: "0.55em",
                              color: isNotWinner ? "#855e09" : "#f3d48d",
                              marginRight: "4px",
                              fontWeight: 800,
                              lineHeight: 1,
                              display: "inline-block",
                              transform: "translateY(-0.04em)",
                              textShadow: isNotWinner ? "none" : "0 2px 8px rgba(0,0,0,0.5)",
                            }}
                          >
                            #
                          </span>
                          <span
                            style={{
                              color: isNotWinner ? "#530017" : undefined,
                              textShadow: isNotWinner ? "none" : undefined,
                            }}
                          >
                            {cleanNum}
                          </span>
                        </>
                      );
                    })()}
                  </strong>
                </div>

                {!isNotWinner && (
                  <p
                    style={{
                      color: "rgba(255, 247, 232, 0.9)",
                      fontSize: "14.5px",
                      lineHeight: "1.6",
                      maxWidth: "460px",
                      margin: "20px auto 0",
                      textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                  >
                    {celebration === "winner"
                      ? `Parabéns! Você foi contemplado(a)${activeDrawTitle ? ` no sorteio "${activeDrawTitle}"` : ""}. Apresente esta tela à organização do evento para receber seu prêmio.`
                      : "Quando o seu número for sorteado, esta celebração aparecerá automaticamente no seu celular."}
                  </p>
                )}

                {celebration === "test" ? (
                  <button
                    type="button"
                    onClick={dismissCelebration}
                    className="live-winner-btn-gold"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                    <span>Fechar Teste</span>
                  </button>
                ) : isNotWinner ? (
                  <button
                    type="button"
                    onClick={dismissCelebration}
                    style={{
                      minWidth: "180px",
                      minHeight: "46px",
                      marginTop: "24px",
                      padding: "12px 32px",
                      borderRadius: "10px",
                      background: "#530017",
                      color: "#ffffff",
                      border: "1px solid #530017",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      boxShadow: "0 4px 14px rgba(83, 0, 23, 0.22)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                    <span>Entendi</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginTop: "24px" }}>
                    <button
                      type="button"
                      onClick={dismissCelebration}
                      className="live-winner-btn-gold"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                      <span>Fechar e Voltar ao Portal</span>
                    </button>
                    <span className="live-winner-note">
                      Procure a organização do evento
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
