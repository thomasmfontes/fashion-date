"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useSlotMachine } from "@/hooks/useSlotMachine";
import { useDrawCollection } from "@/hooks/useDrawCollection";
import { useToast } from "@/hooks/useToast";
import { LiveSlotMachine } from "@/components/admin/LiveSlotMachine";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Toast } from "@/components/ui/toast";
import {
  USER_TYPE_LABELS,
  USER_TYPE_ICONS,
  type UserType,
} from "@/types/participant.types";
import {
  formatLuckyNumber,
  buildInstagramUrl,
  cleanInstagramHandle,
} from "@/utils/formatters";

export default function UnifiedDrawPage() {
  const { adminKey, isAuthenticated, isReady, login } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    draws,
    activeDraw,
    activeDrawId,
    selectActiveDraw,
  } = useDrawCollection();

  useWakeLock(true);

  // Unified Slot Machine
  const slotMachine = useSlotMachine(adminKey);
  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    if (slotMachine.error) {
      showToast(slotMachine.error, "error");
    }
  }, [slotMachine.error, showToast]);

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

  function handleSelectFromScreen(drawId: string) {
    selectActiveDraw(drawId);
    setIsDrawerOpen(false);
    const target = draws.find((d) => d.id === drawId);
    showToast(`Rodada alterada para: "${target?.title || "Sorteio"}"`, "success");
  }

  function handleTriggerDraw() {
    slotMachine.triggerDraw(
      activeDraw?.targetUserTypes,
      activeDraw?.hasNumberLimit && activeDraw?.maxNumber ? activeDraw.maxNumber : undefined
    );
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

  const isRunning = slotMachine.isRunning;
  const isMuted = slotMachine.isMuted;
  const toggleMute = slotMachine.toggleMute;
  const hasWinner = Boolean(slotMachine.winner);

  const targetTypes = activeDraw?.targetUserTypes || ["lojista", "influencer", "visitante", "vip"];
  const isAllTypes = targetTypes.length >= 4;
  const numberLimitText = activeDraw?.hasNumberLimit && activeDraw?.maxNumber
    ? ` · Até Nº ${String(activeDraw.maxNumber).padStart(4, "0")}`
    : "";

  const winnerType: UserType = slotMachine.winner?.userType || "lojista";

  return (
    <main
      className={`draw-page${isRunning ? " is-running" : ""}${hasWinner ? " has-winner" : ""}`}
    >
      {/* Confetti Animation */}
      {hasWinner && (
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

      {/* Header do Palco */}
      <header className="draw-header">
        <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />

        <div className="draw-event-title" suppressHydrationWarning>
          <span suppressHydrationWarning>
            <i /> {activeDraw?.prizeTitle || "Prêmio Especial"} · {isAllTypes ? "Todos os Participantes" : targetTypes.map((t) => USER_TYPE_LABELS[t]).join(", ")}{numberLimitText}
          </span>
          <h1 suppressHydrationWarning>{activeDraw?.title || "Sorteio Oficial"}</h1>
        </div>

        <div className="draw-header-controls">
          {/* Sorteios do Acervo Drawer Button */}
          <button
            type="button"
            className={`draw-acervo-btn ${isDrawerOpen ? "active" : ""}`}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            disabled={isRunning}
            title="Escolher rodada do acervo"
          >
            <span className="material-symbols-outlined">collections_bookmark</span>
            <span>Acervo ({draws.length})</span>
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
            <span>{isMuted ? "Mudo" : "Som"}</span>
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

      {/* Drawer de Seleção Rápida de Rodadas do Acervo */}
      {isDrawerOpen && (
        <div className="screen-acervo-drawer">
          <div className="drawer-header">
            <strong>
              <span className="material-symbols-outlined">collections_bookmark</span>
              Selecionar Rodada do Acervo
            </strong>
            <button
              type="button"
              className="drawer-close"
              onClick={() => setIsDrawerOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="drawer-list">
            {draws.map((d, index) => {
              const isSelected = d.id === activeDrawId;
              const dTypes = d.targetUserTypes || ["lojista", "influencer", "visitante", "vip"];
              const dIsAll = dTypes.length >= 4;

              return (
                <button
                  key={d.id}
                  type="button"
                  className={`drawer-item-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectFromScreen(d.id)}
                >
                  <span className="drawer-order">#{index + 1}</span>
                  <div className="drawer-text">
                    <strong>{d.title}</strong>
                    <small>
                      Prêmio: {d.prizeTitle} · {dIsAll ? "Todos" : dTypes.map((t) => USER_TYPE_LABELS[t]).join(", ")}
                      {d.hasNumberLimit && d.maxNumber ? ` · Até Nº ${d.maxNumber}` : ""}
                    </small>
                  </div>
                  {isSelected && (
                    <span className="drawer-active-badge">No Ar</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Palco do Sorteio / Anúncio do Vencedor */}
      {slotMachine.winner ? (
        <section className="winner-panel" aria-live="polite">
          <div className="winner-emblem">
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <p className="draw-overline">O número sorteado foi</p>
          <strong className="lucky-number">
            {formatLuckyNumber(slotMachine.winner.luckyNumber)}
          </strong>
          <div className="winner-divider">
            <span />
          </div>
          <p className="winner-announcement">Temos um vencedor para {activeDraw?.prizeTitle || "o prêmio"}!</p>
          <h2 className="winner-name">{slotMachine.winner.name}</h2>
          
          <div className="winner-meta">
            <span className="winner-user-type-badge">
              <span className="material-symbols-outlined">{USER_TYPE_ICONS[winnerType]}</span>
              {USER_TYPE_LABELS[winnerType]}
            </span>

            <span>
              <b className="material-symbols-outlined">storefront</b>
              {slotMachine.winner.store}
            </span>

            <a
              href={buildInstagramUrl(slotMachine.winner.instagram)}
              target="_blank"
              rel="noreferrer"
            >
              <img
                className="winner-instagram-icon"
                src="https://cdn.simpleicons.org/instagram/530017"
                alt=""
              />
              @{cleanInstagramHandle(slotMachine.winner.instagram)}
            </a>
          </div>

          <div className="winner-actions">
            <button
              className="admin-button primary"
              type="button"
              onClick={slotMachine.resetDraw}
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              Sortear novamente
            </button>
            <a className="admin-button" href="/admin">
              <span className="material-symbols-outlined">arrow_back</span>
              Ver vencedores
            </a>
          </div>
        </section>
      ) : (
        <section className="draw-stage">
          <div className="draw-status">
            <i />
            {slotMachine.isRunning
              ? "Tambores girando... Aguarde a revelação"
              : `Prêmio em disputa: ${activeDraw?.prizeTitle || "Prêmio Especial"}`}
          </div>

          <div className="draw-card">
            <p>
              {slotMachine.isRunning
                ? "Sorteando o número da sorte..."
                : "Número da sorte"}
            </p>

            {/* 4 Tambores Mecânicos */}
            <LiveSlotMachine digits={slotMachine.slotStates} />

            <div className="draw-line">
              <span />
            </div>
            <strong>
              {slotMachine.isRunning
                ? slotMachine.lockedCount > 0
                  ? `Fixando dígitos (${slotMachine.lockedCount}/4)...`
                  : "Girando tambores..."
                : `Boa sorte aos participantes (${isAllTypes ? "Todos os Perfis" : targetTypes.map((t) => USER_TYPE_LABELS[t]).join(", ")})`}
            </strong>
          </div>

          <div className="draw-controls">
            <button
              className="primary-button"
              type="button"
              onClick={handleTriggerDraw}
              disabled={slotMachine.isRunning}
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              {slotMachine.isRunning ? "Sorteando..." : "Sortear agora"}
            </button>
            <a className="back-link" href="/admin">
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar ao painel
            </a>
          </div>
        </section>
      )}

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}
