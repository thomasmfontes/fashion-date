"use client";

import { type CSSProperties } from "react";
import { useLiveAlert } from "@/hooks/useLiveAlert";

interface LiveDrawAlertProps {
  luckyNumber?: string;
}

const CONFETTI_COLORS = ["#c99b36", "#530017", "#e8c66d", "#8b2f47", "#f8efe1"];

export default function LiveDrawAlert({ luckyNumber }: LiveDrawAlertProps) {
  const {
    isEnabled,
    isConnected,
    celebration,
    alarmActive,
    drawnNumber,
    enableAlert,
    silenceAlarm,
    dismissCelebration,
    triggerTest,
  } = useLiveAlert(luckyNumber);

  return (
    <>
      <section className={`live-alert-card${isEnabled ? " is-enabled" : ""}`}>
        <div className="live-alert-icon">
          <span className="material-symbols-outlined">notifications_active</span>
        </div>
        <div className="live-alert-copy">
          <span>Sorteio ao vivo</span>
          <h2>
            {isEnabled
              ? "Seu alerta está ativado"
              : "Receba o resultado no celular"}
          </h2>
          <p>
            {isEnabled
              ? "Mantenha esta página aberta. Avisaremos se este número for sorteado."
              : "Ative som, vibração, confetes e mantenha a tela acordada durante o sorteio."}
          </p>
        </div>
        <div className="live-alert-actions">
          {isEnabled ? (
            <>
              <span
                className={`live-connection${isConnected ? " online" : ""}`}
              >
                <i />
                {isConnected ? "Conectado" : "Reconectando"}
              </span>
              <button onClick={triggerTest}>
                <span className="material-symbols-outlined">campaign</span>
                Testar alerta
              </button>
            </>
          ) : (
            <button
              className="activate"
              onClick={enableAlert}
              disabled={!luckyNumber}
            >
              <span className="material-symbols-outlined">
                power_settings_new
              </span>
              Ativar alerta
            </button>
          )}
        </div>
      </section>

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
            <header className="live-winner-brand">
              <img src="/fashiondate-logo.png" alt="Fashion Date" />
              <span>Fashion Date · 2026</span>
            </header>
            <div className="live-winner-kicker">
              <i />
              {celebration === "winner"
                ? "Resultado ao vivo"
                : celebration === "not-winner"
                  ? "Sorteio realizado"
                  : "Teste do alerta"}
              <i />
            </div>
            <h2>
              {celebration === "winner"
                ? "Você ganhou!"
                : celebration === "not-winner"
                  ? "Não foi dessa vez"
                  : "Tudo pronto!"}
            </h2>
            <div className="live-winning-ticket">
              <span>
                {celebration === "not-winner"
                  ? "Número sorteado"
                  : celebration === "winner"
                    ? "Número vencedor"
                    : "Seu número da sorte"}
              </span>
              <strong>
                {celebration === "not-winner"
                  ? drawnNumber
                  : luckyNumber || "----"}
              </strong>
            </div>
            <p>
              {celebration === "winner"
                ? "Parabéns! Apresente esta tela à organização do evento para receber seu prêmio."
                : celebration === "not-winner"
                  ? `O seu número ${luckyNumber} não foi sorteado, mas continua válido para os próximos sorteios.`
                  : "Quando o seu número for sorteado, esta celebração aparecerá automaticamente no seu celular."}
            </p>
            {celebration === "test" ? (
              <button onClick={dismissCelebration}>Fechar teste</button>
            ) : celebration === "not-winner" ? (
              <button onClick={dismissCelebration}>
                <span className="material-symbols-outlined">check</span>
                Entendi
              </button>
            ) : (
              <>
                <button onClick={silenceAlarm} disabled={!alarmActive}>
                  <span className="material-symbols-outlined">
                    {alarmActive ? "volume_off" : "notifications_paused"}
                  </span>
                  {alarmActive ? "Silenciar alerta" : "Alerta silenciado"}
                </button>
                <span className="live-winner-note">
                  Procure a equipe Fashion Date
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
