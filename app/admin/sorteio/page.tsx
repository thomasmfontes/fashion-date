"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useSlotMachine } from "@/hooks/useSlotMachine";
import { useToast } from "@/hooks/useToast";
import { LiveSlotMachine } from "@/components/admin/LiveSlotMachine";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Toast } from "@/components/ui/toast";
import {
  formatLuckyNumber,
  buildInstagramUrl,
  cleanInstagramHandle,
} from "@/utils/formatters";

export default function DrawPage() {
  const { adminKey, isAuthenticated, isReady, login } = useAuth();
  const [loginError, setLoginError] = useState("");
  useWakeLock(true);

  const {
    slotStates,
    lockedCount,
    isRunning,
    winner,
    error,
    isMuted,
    toggleMute,
    triggerDraw,
    resetDraw,
  } = useSlotMachine(adminKey);

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

  // If not authenticated, render login portal directly on stage without bounce redirect
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

  return (
    <main
      className={`draw-page${isRunning ? " is-running" : ""}${winner ? " has-winner" : ""}`}
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
            <i /> Sorteio ao vivo
          </span>
          <h1>Provador Fashion</h1>
        </div>
        <div className="draw-header-controls">
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
        <section className="winner-panel" aria-live="polite">
          <div className="winner-emblem">
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <p className="draw-overline">O número sorteado foi</p>
          <strong className="lucky-number">
            {formatLuckyNumber(winner.luckyNumber)}
          </strong>
          <div className="winner-divider">
            <span />
          </div>
          <p className="winner-announcement">Temos um vencedor!</p>
          <h2 className="winner-name">{winner.name}</h2>
          <div className="winner-meta">
            <span>
              <b className="material-symbols-outlined">storefront</b>
              {winner.store}
            </span>
            <a
              href={buildInstagramUrl(winner.instagram)}
              target="_blank"
              rel="noreferrer"
            >
              <img
                className="winner-instagram-icon"
                src="https://cdn.simpleicons.org/instagram/530017"
                alt=""
              />
              @{cleanInstagramHandle(winner.instagram)}
            </a>
          </div>

          <div className="winner-actions">
            <button
              className="admin-button primary"
              type="button"
              onClick={resetDraw}
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              Sortear novamente
            </button>
            <Link className="admin-button" href="/admin">
              <span className="material-symbols-outlined">arrow_back</span>
              Ver vencedores
            </Link>
          </div>
        </section>
      ) : (
        <section className="draw-stage">
          <div className="draw-status">
            <i />
            {isRunning
              ? "Tambores girando... Aguarde a revelação"
              : "Tudo pronto para o sorteio"}
          </div>

          <div className="draw-card">
            <p>
              {isRunning
                ? "Sorteando o número da sorte..."
                : "Número da sorte"}
            </p>

            {/* 4 Tambores Slot Machine */}
            <LiveSlotMachine digits={slotStates} />

            <div className="draw-line">
              <span />
            </div>
            <strong>
              {isRunning
                ? lockedCount > 0
                  ? `Fixando dígitos (${lockedCount}/4)...`
                  : "Girando tambores..."
                : "Boa sorte a todos os lojistas"}
            </strong>
          </div>

          <div className="draw-controls">
            <button
              className="primary-button"
              type="button"
              onClick={triggerDraw}
              disabled={isRunning}
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              {isRunning ? "Sorteando..." : "Sortear agora"}
            </button>
            <Link className="back-link" href="/admin">
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar ao painel
            </Link>
          </div>
        </section>
      )}

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}
