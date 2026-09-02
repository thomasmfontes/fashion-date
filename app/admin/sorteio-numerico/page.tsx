"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useNumericSlotMachine } from "@/hooks/useNumericSlotMachine";
import { useToast } from "@/hooks/useToast";
import { NumericLiveSlotMachine } from "@/components/admin/NumericLiveSlotMachine";
import { NumericDrawModal } from "@/components/admin/NumericDrawModal";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Toast } from "@/components/ui/toast";

export default function NumericDrawPage() {
  const { isAuthenticated, isReady, login } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  useWakeLock(true);

  const {
    config,
    updateConfig,
    slotStates,
    lockedCount,
    isRunning,
    winner,
    history,
    error,
    isMuted,
    toggleMute,
    triggerDraw,
    resetDraw,
    clearHistory,
    removeHistoryItem,
  } = useNumericSlotMachine();

  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showToast("O navegador não permitiu alternar tela cheia.", "error");
    }
  }

  // If not authenticated, render login portal directly
  if (isReady && !isAuthenticated) {
    return (
      <AdminLoginForm
        onLogin={(key) => {
          setLoginError("");
          login(key);
        }}
        error={loginError}
      />
    );
  }

  const totalPossible = Math.max(0, config.max - config.min + 1);
  const remainingCount = config.allowRepeat
    ? totalPossible
    : Math.max(0, totalPossible - history.length);

  return (
    <main
      className={`draw-page numeric-draw-page${isRunning ? " is-running" : ""}${winner ? " has-winner" : ""}`}
    >
      {winner && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 48 }).map((_, i) => (
            <i
              key={i}
              style={
                {
                  left: `${(i * 2.1) % 100}%`,
                  animationDelay: `${(i * 0.12) % 2.5}s`,
                  animationDuration: `${3.5 + ((i * 0.2) % 2.5)}s`,
                  "--drift": `${((i % 7) - 3) * 60}px`,
                  background:
                    i % 3 === 0
                      ? "#e7c275"
                      : i % 3 === 1
                        ? "#530017"
                        : "#fff4d4",
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="draw-backdrop" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <header className="draw-header">
        <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
        <div className="draw-event-title">
          <span>
            <i /> {config.eventName || "Sorteio Numérico"}
          </span>
          <h1>{config.prizeTitle || "Sorteio de Prêmios"}</h1>
        </div>
        <div className="draw-header-controls">
          <button
            className="draw-config-toggle"
            type="button"
            onClick={() => setIsConfigOpen(true)}
            aria-label="Abrir configurações de sorteio"
            title="Configurar intervalo e prêmios"
          >
            <span className="material-symbols-outlined">tune</span>
            <span>Configurar</span>
          </button>
          <button
            className={`draw-sound-toggle${isMuted ? " is-muted" : ""}`}
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Ativar efeitos sonoros" : "Silenciar áudio"}
            title={isMuted ? "Ativar som" : "Silenciar som"}
          >
            <span className="material-symbols-outlined">
              {isMuted ? "volume_off" : "volume_up"}
            </span>
            <span>{isMuted ? "Mudo" : "Som ativo"}</span>
          </button>
          <button
            className="draw-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            aria-label="Alternar tela cheia"
            title="Tela cheia"
          >
            <span className="material-symbols-outlined">fullscreen</span>
          </button>
        </div>
      </header>

      {winner ? (
        <section className="winner-panel numeric-winner-panel" aria-live="polite">
          <div className="winner-trophy-badge">
            <span className="material-symbols-outlined">workspace_premium</span>
            <span>Número Contemplado</span>
          </div>

          <div className="draw-slots-wrap winner-slots-wrap">
            {winner.number.split("").map((digit, idx) => (
              <div key={idx} className="draw-slot-digit is-locked">
                <span className="slot-sheen" />
                <span className="slot-num">{digit}</span>
              </div>
            ))}
          </div>

          <div className="winner-card-body">
            <div className="winner-prize-banner">
              <span className="winner-prize-kicker">Parabéns ao Ganhador(a)</span>
              <h3 className="winner-prize-title">{winner.prizeTitle}</h3>
            </div>

            <div className="winner-meta">
              <span className="winner-pill winner-pill-type">
                <span className="material-symbols-outlined">schedule</span>
                <span>Sorteado às {winner.drawnAt}</span>
              </span>

              <span className="winner-pill winner-pill-store">
                <span className="material-symbols-outlined">tag</span>
                <span>Intervalo: {String(config.min).padStart(3, "0")} a {String(config.max).padStart(3, "0")}</span>
              </span>
            </div>

            <div className="winner-actions">
              <button
                className="winner-btn-primary"
                type="button"
                onClick={() => {
                  resetDraw();
                  showToast("Pronto para o próximo sorteio!");
                }}
              >
                <span className="material-symbols-outlined">casino</span>
                <span>Próximo Sorteio</span>
              </button>
              <button
                className="winner-btn-secondary"
                type="button"
                onClick={() => setIsConfigOpen(true)}
              >
                <span className="material-symbols-outlined">tune</span>
                <span>Trocar Prêmio / Intervalo</span>
              </button>
              <a className="winner-btn-secondary" href="/admin/vencedores">
                <span className="material-symbols-outlined">workspace_premium</span>
                <span>Painel de Vencedores</span>
              </a>
            </div>
          </div>
        </section>
      ) : (
        <section className="draw-stage">
          <div className="draw-status">
            <i />
            {isRunning
              ? "Tambores girando... Aguarde a revelação"
              : `Intervalo ativo: ${String(config.min).padStart(3, "0")} a ${String(config.max).padStart(3, "0")} (${remainingCount} disponíveis)`}
          </div>

          <div className="draw-card numeric-draw-card">
            <div className="numeric-card-header">
              <span className="prize-badge">
                <span className="material-symbols-outlined">card_giftcard</span>
                {config.prizeTitle}
              </span>
            </div>

            <p>
              {isRunning
                ? "Sorteando o número premiado..."
                : "Número da sorte"}
            </p>

            {/* Tambores mecânicos do sorteio */}
            <NumericLiveSlotMachine digits={slotStates} />

            <div className="draw-line">
              <span />
            </div>
            <strong>
              {isRunning
                ? lockedCount > 0
                  ? `Fixando dígitos (${lockedCount}/${slotStates.length})...`
                  : "Rufem os tambores..."
                : `Boa sorte aos participantes (${String(config.min).padStart(3, "0")} a ${String(config.max).padStart(3, "0")})`}
            </strong>
          </div>

          <div className="draw-controls">
            <button
              className="primary-button"
              type="button"
              onClick={triggerDraw}
              disabled={isRunning || remainingCount === 0}
            >
              <span className="material-symbols-outlined">casino</span>
              {isRunning
                ? "Sorteando..."
                : remainingCount === 0
                  ? "Intervalo Esgotado"
                  : "Sortear agora"}
            </button>

            <button
              className="secondary-glass-button"
              type="button"
              onClick={() => setIsConfigOpen(true)}
              disabled={isRunning}
            >
              <span className="material-symbols-outlined">tune</span>
              Configurações & Histórico ({history.length})
            </button>

            <a className="back-link" href="/admin">
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar ao painel
            </a>
          </div>
        </section>
      )}

      {/* Modal de Configuração e Histórico */}
      <NumericDrawModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={(newConf) => {
          updateConfig(newConf);
          showToast("Configurações atualizadas!");
        }}
        history={history}
        onClearHistory={() => {
          clearHistory();
          showToast("Histórico limpo com sucesso.");
        }}
        onRemoveHistoryItem={(id) => {
          removeHistoryItem(id);
          showToast("Número removido do histórico.");
        }}
      />

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}
