"use client";

import { type CSSProperties } from "react";
import { useLiveAlert } from "@/hooks/useLiveAlert";

interface LiveDrawAlertProps {
  luckyNumber?: string | string[];
}

const CONFETTI_COLORS = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export default function LiveDrawAlert({ luckyNumber }: LiveDrawAlertProps) {
  const {
    isEnabled,
    isConnected,
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
  } = useLiveAlert(luckyNumber);

  const primaryNumber =
    winningTicket?.ticketNumber ||
    (Array.isArray(luckyNumber) ? luckyNumber[0] : luckyNumber);
  const hasNumbers = Array.isArray(luckyNumber) ? luckyNumber.length > 0 : Boolean(luckyNumber);

  return (
    <>
      <div
        className="stitch-panel-card stitch-live-alert-card"
        style={{
          border: isEnabled ? "1.5px solid #c79a36" : "1px solid #ebdcc5",
          background: isEnabled ? "linear-gradient(180deg, #ffffff 0%, #fffcf8 100%)" : "#ffffff",
          boxShadow: isEnabled
            ? "0 4px 20px rgba(154, 116, 26, 0.08)"
            : "0 2px 10px rgba(67, 0, 20, 0.03)",
          height: "auto",
        }}
      >
        <div className="stitch-live-alert-body">
          {/* Top header on mobile / icon on desktop */}
          <div className="stitch-live-alert-icon"
            style={{
              background: isEnabled ? "rgba(201, 155, 54, 0.14)" : "rgba(83, 0, 23, 0.06)",
              color: isEnabled ? "#9a741a" : "#530017",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
              {isEnabled ? "notifications_active" : "notifications"}
            </span>
          </div>

          {/* Copy info */}
          <div className="stitch-live-alert-info">
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a741a", marginBottom: "4px" }}>
              Sincronização ao Vivo
            </span>

            <h2 style={{ fontFamily: "var(--font-fashion, serif)", fontSize: "19px", margin: "0 0 6px", color: "#530017", lineHeight: "1.25" }}>
              {isEnabled ? "Alerta em Tempo Real Ativado" : "Receba o Resultado no Celular"}
            </h2>
            <p style={{ margin: 0, color: "#6e5d60", fontSize: "13px", lineHeight: "1.5" }}>
              {isEnabled
                ? "Mantenha esta tela aberta durante os sorteios no palco oficial. Se qualquer um dos seus números for contemplado, seu celular tocará e vibrará instantaneamente!"
                : "Ative som, vibração e tela ativa para receber a notificação imediata caso o seu número da sorte seja premiado."}
            </p>
          </div>

          {/* Action button */}
          <div className="stitch-live-alert-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="stitch-button outline"
              onClick={triggerTest}
              title="Testar som e celebração no celular"
            >
              <span className="material-symbols-outlined">volume_up</span>
              <span>Testar Alerta</span>
            </button>
            {!isEnabled && (
              <button
                type="button"
                className="stitch-button filled"
                onClick={enableAlert}
                title="Ativar som e alerta ao vivo"
              >
                <span className="material-symbols-outlined">power_settings_new</span>
                <span>Ativar Alerta</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
                      background:
                        CONFETTI_COLORS[index % CONFETTI_COLORS.length],
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
                  ? "RESULTADO OFICIAL"
                  : celebration === "not-winner"
                    ? "SORTEIO REALIZADO"
                    : "TESTE DO ALERTA"}
              </span>
              <i style={{ width: "32px", height: "1px", background: "rgba(231,194,117,0.7)" }} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-fashion, "Playfair Display", Georgia, serif)',
                color: "#fff7e8",
                fontSize: "clamp(46px, 9vw, 84px)",
                fontWeight: 600,
                lineHeight: 1,
                margin: "8px 0 24px",
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

            <div className="live-winning-ticket">
              <span>
                {celebration === "not-winner"
                  ? "Número Sorteado"
                  : celebration === "winner"
                    ? "Número Vencedor"
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
                  const rawNum = celebration === "not-winner" ? drawnNumber : primaryNumber;
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
                ? "Parabéns! Apresente esta tela à organização do evento para receber seu prêmio."
                : celebration === "not-winner"
                  ? `O seu número ${primaryNumber?.startsWith("#") ? primaryNumber : `#${primaryNumber}`} não foi sorteado, mas continua válido para os próximos sorteios.`
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
