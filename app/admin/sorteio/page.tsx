"use client";

import { useEffect, useState, useRef, type CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useSlotMachine } from "@/hooks/useSlotMachine";
import { useDrawCollection } from "@/hooks/useDrawCollection";
import { useToast } from "@/hooks/useToast";
import { LiveSlotMachine } from "@/components/admin/LiveSlotMachine";
import { SlotMachineLever } from "@/components/admin/SlotMachineLever";
import { MobileDrawSlider } from "@/components/admin/MobileDrawSlider";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/Modal";
import { drawService } from "@/services/drawService";
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
  const [eligibility, setEligibility] = useState<{
    eligibleCount: number;
    hasEligible: boolean;
  }>({ eligibleCount: 1, hasEligible: true });
  const [initialEligibilityDone, setInitialEligibilityDone] = useState(false);
  const [isCurtainLeaving, setIsCurtainLeaving] = useState(false);
  const [isCurtainDismissed, setIsCurtainDismissed] = useState(false);

  const {
    draws,
    activeDraw,
    activeDrawId,
    selectActiveDraw,
  } = useDrawCollection(adminKey);

  useWakeLock(true);

  // Unified Slot Machine
  const slotMachine = useSlotMachine(adminKey);
  const { toast, showToast, dismissToast } = useToast();

  const [isOnline, setIsOnline] = useState(true);
  const [showEmergencyCancel, setShowEmergencyCancel] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function probeConnection() {
      // 1. Checagem rápida de hardware
      if (!navigator.onLine) {
        if (isMounted) setIsOnline(false);
        return;
      }

      // 2. Checagem ativa real de tráfego de rede (elimina falsos positivos de loopback ou Wi-Fi sem WAN)
      try {
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        const targetUrl = isLocalhost
          ? "https://www.google.com/favicon.ico"
          : `/api/version?_t=${Date.now()}`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);

        await fetch(targetUrl, {
          method: "HEAD",
          mode: isLocalhost ? "no-cors" : "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timer);
        if (isMounted) setIsOnline(true);
      } catch {
        if (isMounted) setIsOnline(false);
      }
    }

    probeConnection();

    const handleOnline = () => probeConnection();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Heartbeat a cada 3 segundos para detecção em tempo real
    const interval = setInterval(probeConnection, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (slotMachine.isRunning) {
      timer = setTimeout(() => setShowEmergencyCancel(true), 4500);
    } else {
      setShowEmergencyCancel(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [slotMachine.isRunning]);

  useEffect(() => {
    if (slotMachine.error) {
      showToast(slotMachine.error, "error");
    }
  }, [slotMachine.error, showToast]);

  // Safety timer para garantir abertura da cortina mesmo em oscilações de rede
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialEligibilityDone(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Checagem automática e contínua de participantes elegíveis
  useEffect(() => {
    let isMounted = true;
    if (!adminKey || !isAuthenticated) return;

    async function verifyEligibility() {
      const res = await drawService.checkEligibility(
        adminKey,
        activeDraw?.targetUserTypes,
        activeDraw?.hasNumberLimit && activeDraw?.maxNumber ? activeDraw.maxNumber : undefined,
        activeDraw?.id,
      );
      if (isMounted) {
        setEligibility({
          eligibleCount: res.eligibleCount,
          hasEligible: res.hasEligible,
        });
        setInitialEligibilityDone(true);
      }
    }

    verifyEligibility();
    const interval = setInterval(verifyEligibility, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [adminKey, isAuthenticated, activeDrawId, activeDraw, slotMachine.winner, slotMachine.isRunning]);

  // Recolhe a cortina teatral suavemente apenas quando tudo estiver 100% carregado e pronto
  useEffect(() => {
    if (isReady && isAuthenticated && activeDraw && initialEligibilityDone && !isCurtainDismissed) {
      const t1 = setTimeout(() => {
        setIsCurtainLeaving(true);
      }, 350);
      const t2 = setTimeout(() => {
        setIsCurtainDismissed(true);
      }, 1250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isReady, isAuthenticated, activeDraw, initialEligibilityDone, isCurtainDismissed]);

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

  // Ao alterar a rodada/acervo, retorna direto para a tela da roleta limpa
  const prevActiveDrawIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevActiveDrawIdRef.current !== null && prevActiveDrawIdRef.current !== activeDrawId) {
      slotMachine.resetDraw();
    }
    prevActiveDrawIdRef.current = activeDrawId;
  }, [activeDrawId, slotMachine]);

  function handleSelectFromScreen(drawId: string) {
    slotMachine.resetDraw();
    selectActiveDraw(drawId);
    setIsDrawerOpen(false);
    const target = draws.find((d) => d.id === drawId);
    showToast(`Rodada alterada para: "${target?.title || "Sorteio"}"`, "success");
  }

  function handleTriggerDraw() {
    if (!eligibility.hasEligible) {
      showToast("Não há participantes disponíveis para esta rodada.", "error");
      return;
    }
    slotMachine.triggerDraw(
      activeDraw?.targetUserTypes,
      activeDraw?.hasNumberLimit && activeDraw?.maxNumber ? activeDraw.maxNumber : undefined,
      activeDraw?.id,
      activeDraw?.title,
      activeDraw?.prizeTitle,
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
  const isAnonymous = Boolean(
    slotMachine.winner?.isAnonymous ||
    activeDraw?.allowTicketGeneration === false ||
    (slotMachine.winner && Number(slotMachine.winner.id) === 0),
  );

  const targetTypes = activeDraw?.targetUserTypes || ["lojista", "revendedor", "influencer", "visitante"];
  const isAllTypes = targetTypes.length >= 4;
  const numberLimitText = activeDraw?.hasNumberLimit && activeDraw?.maxNumber
    ? ` · Até Nº ${String(activeDraw.maxNumber).padStart(4, "0")}`
    : "";

  const winnerType: UserType = slotMachine.winner?.userType || "lojista";

  return (
    <main
      className={`draw-page${isRunning ? " is-running" : ""}${hasWinner ? " has-winner" : ""}`}
    >
      {/* Cortina Teatral de Preparação: Permanece até os dados estarem 100% carregados e validados */}
      {!isCurtainDismissed && (
        <div
          className={`draw-transition is-active${isCurtainLeaving ? " is-leaving" : ""}`}
          aria-hidden="true"
        >
          <span className="draw-transition-panel left" />
          <span className="draw-transition-panel right" />
          <div className="draw-transition-brand">
            <img src="/fashiondate-logo.png" alt="" />
            <i />
            <p>Preparando o sorteio</p>
            <span>Boa sorte a todos</span>
          </div>
        </div>
      )}

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
            <i /> {activeDraw?.allowTicketGeneration === false ? `Sorteio Presencial${numberLimitText}` : (isAllTypes ? "Todos os Participantes" : targetTypes.map((t) => USER_TYPE_LABELS[t]).join(", ")) + numberLimitText}
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
            <span suppressHydrationWarning>Acervo ({draws.length})</span>
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

      {/* Modal de Seleção Rápida de Rodadas do Acervo (Mesma estrutura de Participantes e Vencedores) */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Rodadas do Sorteio"
        badge={
          <span className="edit-ticket-badge">
            Acervo: <strong>{draws.length} {draws.length === 1 ? "Rodada" : "Rodadas"}</strong>
          </span>
        }
        className="acervo-modal"
      >
        <div className="drawer-list">
          {draws.length === 0 ? (
            <div className="drawer-empty-state">
              <span className="material-symbols-outlined">sentiment_dissatisfied</span>
              <p>Nenhuma rodada cadastrada no acervo.</p>
            </div>
          ) : (
            draws.map((d, index) => {
              const isSelected = d.id === activeDrawId;
              const dTypes = d.targetUserTypes || ["lojista", "influencer", "visitante", "vip"];
              const dIsAll = dTypes.length >= 4;
              const profileLabel = dIsAll
                ? "Todos os Perfis"
                : dTypes.map((t) => USER_TYPE_LABELS[t]).join(", ");

              return (
                <button
                  key={d.id}
                  type="button"
                  className={`drawer-item-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectFromScreen(d.id)}
                >
                  <div className="drawer-item-top">
                    <div className="drawer-item-title-wrap">
                      <span className="drawer-order">#{String(index + 1).padStart(2, "0")}</span>
                      <strong className="drawer-item-title">{d.title}</strong>
                    </div>

                    {isSelected ? (
                      <span className="drawer-active-badge">
                        <span className="pulse-dot" />
                        No Ar
                      </span>
                    ) : (
                      <span className="drawer-select-hint">
                        <span className="material-symbols-outlined">play_circle</span>
                        Ativar
                      </span>
                    )}
                  </div>

                  <div className="drawer-item-details">
                    {d.prizeTitle && (
                      <div className="drawer-detail-row prize">
                        <span className="material-symbols-outlined">workspace_premium</span>
                        <span>Prêmio: <strong>{d.prizeTitle}</strong></span>
                      </div>
                    )}

                    <div className="drawer-tags-row">
                      <span className="drawer-tag profile">
                        <span className="material-symbols-outlined">group</span>
                        {profileLabel}
                      </span>

                      {d.hasNumberLimit && d.maxNumber && (
                        <span className="drawer-tag limit">
                          <span className="material-symbols-outlined">pin</span>
                          Até Nº {d.maxNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <footer className="edit-modal-footer">
          <button
            type="button"
            className="stitch-button outline"
            onClick={() => setIsDrawerOpen(false)}
          >
            Fechar
          </button>
        </footer>
      </Modal>

      {/* Palco do Sorteio / Anúncio do Vencedor */}
      {slotMachine.winner ? (
        <section className="draw-stage winner-stage">
          <div className="winner-panel" aria-live="polite">
            <div className="winner-trophy-badge">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span>Número Contemplado</span>
            </div>

            <div className="draw-slots-wrap winner-slots-wrap">
              {formatLuckyNumber(slotMachine.winner.luckyNumber)
                .split("")
                .map((digit, idx) => (
                  <div key={idx} className="draw-slot-digit is-locked">
                    <span className="slot-sheen" />
                    <span className="slot-num">{digit}</span>
                  </div>
                ))}
            </div>

            <div className="winner-card-body">
              {isAnonymous ? (
                <p
                  style={{
                    fontSize: "clamp(17px, 2vw, 22px)",
                    fontFamily: 'var(--font-fashion, "Bodoni Moda", "Cinzel", serif)',
                    fontWeight: 600,
                    color: "#530017",
                    letterSpacing: "0.03em",
                    margin: "12px 0 6px",
                    textAlign: "center",
                  }}
                >
                  Contemplado/a, apresente-se!
                </p>
              ) : (
                <>
                  <div className="winner-prize-banner">
                    <span className="winner-prize-kicker">Ganhador do Sorteio</span>
                  </div>

                  <h2 className="winner-name">{slotMachine.winner.name}</h2>

                  <div className="winner-meta">
                    <span className="winner-pill winner-pill-type">
                      <span className="material-symbols-outlined">{USER_TYPE_ICONS[winnerType]}</span>
                      <span>{USER_TYPE_LABELS[winnerType]}</span>
                    </span>

                    <span className="winner-pill winner-pill-store">
                      <span className="material-symbols-outlined">storefront</span>
                      <span>{slotMachine.winner.store}</span>
                    </span>

                    {slotMachine.winner.instagram && (
                      <a
                        className="winner-pill winner-pill-instagram"
                        href={buildInstagramUrl(slotMachine.winner.instagram)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="winner-social-icon"
                          src="https://cdn.simpleicons.org/instagram/e1306c"
                          alt="Instagram"
                          width={16}
                          height={16}
                          style={{ width: 16, height: 16, minWidth: 16, minHeight: 16, maxWidth: 16, maxHeight: 16, display: "inline-block", verticalAlign: "middle" }}
                        />
                        <span>@{cleanInstagramHandle(slotMachine.winner.instagram)}</span>
                      </a>
                    )}

                    {slotMachine.winner.phone && (
                      <a
                        className="winner-pill winner-pill-whatsapp"
                        href={`https://wa.me/55${slotMachine.winner.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="winner-social-icon"
                          src="https://cdn.simpleicons.org/whatsapp/25d366"
                          alt="WhatsApp"
                          width={16}
                          height={16}
                          style={{ width: 16, height: 16, minWidth: 16, minHeight: 16, maxWidth: 16, maxHeight: 16, display: "inline-block", verticalAlign: "middle" }}
                        />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </>
              )}

              <div
                className="winner-actions"
                style={isAnonymous ? { marginTop: "14px" } : undefined}
              >
                <button
                  className="winner-btn-primary"
                  type="button"
                  onClick={slotMachine.resetDraw}
                >
                  <span className="material-symbols-outlined">refresh</span>
                  <span>Sortear Novamente</span>
                </button>
                <a className="winner-btn-secondary" href="/admin/vencedores">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  <span>Painel de Vencedores</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="draw-stage">
          <div className="draw-status" suppressHydrationWarning>
            <i />
            {`Prêmio em disputa: ${activeDraw?.prizeTitle || "Prêmio Especial"}`}
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
                  : "Sorteando o número da sorte..."
                : !eligibility.hasEligible
                  ? "Nenhum número disponível para esta rodada"
                  : activeDraw?.allowTicketGeneration === false
                    ? `Boa sorte aos participantes (${activeDraw?.hasNumberLimit && activeDraw?.maxNumber ? `Até Nº ${String(activeDraw.maxNumber).padStart(4, "0")}` : "Nº 0001 a 9999"})`
                    : `Boa sorte aos participantes (${isAllTypes ? "Todos os Perfis" : targetTypes.map((t) => USER_TYPE_LABELS[t]).join(", ")})`}
            </strong>

            {/* Alavanca Mecânica de Luxo Embutida na Moldura (Desktop) */}
            <SlotMachineLever
              onPull={handleTriggerDraw}
              disabled={!eligibility.hasEligible || slotMachine.isRunning}
              isSpinning={slotMachine.isRunning}
            />

            {/* Botão de Parada de Emergência (exibido caso a roleta demore mais de 4.5s) */}
            {showEmergencyCancel && (
              <div className="draw-emergency-wrap">
                <button
                  type="button"
                  className="draw-emergency-btn"
                  onClick={slotMachine.cancelDraw}
                  title="Interromper giro da roleta imediatamente"
                >
                  <span className="material-symbols-outlined">stop_circle</span>
                  <span>Interromper Giro (Segurança)</span>
                </button>
              </div>
            )}
          </div>

          {/* Console Tátil Exclusivo para Dispositivos Móveis (Slider Interativo) */}
          <div className="mobile-draw-console">
            <MobileDrawSlider
              onTrigger={handleTriggerDraw}
              disabled={!eligibility.hasEligible || slotMachine.isRunning}
              isSpinning={slotMachine.isRunning}
              disabledReason={
                !eligibility.hasEligible
                  ? "Sem Participantes"
                  : undefined
              }
            />
          </div>

          <div className="draw-controls">
            <a className="back-link" href="/admin">
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar ao painel
            </a>
          </div>
        </section>
      )}

      {/* Modal de Contingência de Erro de Conexão no Sorteio */}
      {slotMachine.error && (
        <div className="draw-error-overlay" role="alertdialog" aria-modal="true">
          <div className="draw-error-modal">
            <div className="draw-error-badge">
              <span className="material-symbols-outlined">wifi_off</span>
              <span>Atenção na Conexão</span>
            </div>
            <h2>Instabilidade no Sorteio</h2>
            <p>{slotMachine.error}</p>
            <div className="draw-error-actions">
              <button
                type="button"
                className="draw-error-retry-btn"
                onClick={slotMachine.clearError}
              >
                <span className="material-symbols-outlined">refresh</span>
                <span>Tentar Novamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador Flutuante Discreto de Conexão no Canto Direito Inferior */}
      <div
        className={`draw-floating-network-badge ${isOnline ? "is-online" : "is-offline"}`}
        title={isOnline ? "Conexão de rede ativa e estável" : "Atenção: computador sem internet"}
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "68px",
          right: "72px",
          left: "auto",
          top: "auto",
          zIndex: 9999,
        }}
      >
        <span className="draw-network-dot" />
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}
