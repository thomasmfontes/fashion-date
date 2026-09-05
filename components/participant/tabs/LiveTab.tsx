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
        <div className="stitch-actions">
          {isEnabled ? (
            <button
              type="button"
              className="stitch-button outline"
              onClick={triggerTest}
              title="Testar som e vibração no aparelho"
            >
              <span className="material-symbols-outlined">volume_up</span>
              <span>Testar Alerta</span>
            </button>
          ) : (
            <button
              type="button"
              className="stitch-button filled"
              onClick={enableAlert}
              disabled={luckyNumbers.length === 0}
              title={luckyNumbers.length > 0 ? "Ativar som e vibração no aparelho" : "Nenhum número vinculado"}
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
                    </div>

                    {/* Selo Central Majestoso do Número */}
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
          {/* Botão Fechar no Canto Superior */}
          <button
            type="button"
            onClick={dismissCelebration}
            aria-label="Fechar"
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "50%",
              width: "42px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff7e8",
              cursor: "pointer",
              zIndex: 30,
              transition: "background 0.2s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>close</span>
          </button>

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

          <div className="live-winner-content">
            <header className="live-winner-brand" style={{ marginBottom: "8px" }}>
              <img
                src="/fashiondate-logo.png"
                alt="Fashion Date Crente Chic"
                style={{
                  filter: "brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0,0,0,0.5))",
                  opacity: 0.96,
                }}
              />
              <span style={{ color: "#e7c275", letterSpacing: "0.22em", marginTop: "4px", fontWeight: 700 }}>
                7ª EDIÇÃO &middot; CRENTE CHIC
              </span>
            </header>

            <div className="live-winner-kicker" style={{ marginTop: "14px", marginBottom: "8px" }}>
              <i style={{ width: "32px", height: "1px", background: "rgba(231,194,117,0.7)" }} />
              <span style={{ color: "#e7c275", fontSize: "10px", letterSpacing: "0.22em", fontWeight: 700 }}>
                {celebration === "winner"
                  ? (activeDrawTitle ? `RESULTADO OFICIAL · ${activeDrawTitle.toUpperCase()}` : "RESULTADO OFICIAL")
                  : celebration === "not-winner"
                    ? (activeDrawTitle ? `SORTEIO REALIZADO · ${activeDrawTitle.toUpperCase()}` : "SORTEIO REALIZADO")
                    : "TESTE DO ALERTA"}
              </span>
              <i style={{ width: "32px", height: "1px", background: "rgba(231,194,117,0.7)" }} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-fashion, "Playfair Display", Georgia, serif)',
                color: "#fff7e8",
                fontSize: "clamp(42px, 8.5vw, 76px)",
                fontWeight: 600,
                lineHeight: 1.05,
                margin: "8px 0 14px",
                letterSpacing: "-0.02em",
                textShadow: "0 3px 16px rgba(0, 0, 0, 0.45)",
              }}
            >
              {celebration === "winner"
                ? "Você ganhou!"
                : celebration === "not-winner"
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

            <div className="live-winning-ticket">
              <span>
                {celebration === "not-winner"
                  ? "Número Sorteado no Palco"
                  : celebration === "winner"
                    ? `Seu Número Contemplado${activeDrawTitle ? ` (${activeDrawTitle})` : ""}`
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
                }}
              >
                {(() => {
                  const rawNum =
                    celebration === "not-winner"
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
                          color: "#f3d48d",
                          marginRight: "4px",
                          fontWeight: 800,
                          lineHeight: 1,
                          display: "inline-block",
                          transform: "translateY(-0.04em)",
                          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        }}
                      >
                        #
                      </span>
                      <span>{cleanNum}</span>
                    </>
                  );
                })()}
              </strong>
            </div>

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
                : celebration === "not-winner"
                  ? `O número sorteado no palco foi #${drawnNumber.replace(/^#/, "")}${activeDrawTitle ? ` para ${activeDrawTitle}` : ""}. Seus bilhetes continuam registrados para as próximas apurações.`
                  : "Quando o seu número for sorteado, esta celebração aparecerá automaticamente no seu celular."}
            </p>

            {celebration === "test" ? (
              <button
                type="button"
                onClick={dismissCelebration}
                className="live-winner-btn-gold"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                <span>Fechar Teste</span>
              </button>
            ) : celebration === "not-winner" ? (
              <button
                type="button"
                onClick={dismissCelebration}
                className="live-winner-btn-outline"
              >
                <span className="material-symbols-outlined">check</span>
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
        </div>
      )}
    </>
  );
}
