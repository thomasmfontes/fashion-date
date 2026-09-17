"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

const CURRENT_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || "dev";
const AUTO_CHECK_INTERVAL_MS = 15000; // Checagem periódica a cada 15s

export function AppUpdatePrompt() {
  const pathname = usePathname();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastCheckTimeRef = useRef(0);
  const isCheckingRef = useRef(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const baseVersionRef = useRef<string | null>(
    CURRENT_VERSION !== "dev" ? CURRENT_VERSION : null
  );

  // Executa checagem de nova versão no servidor e no Service Worker
  const checkForUpdate = useCallback(
    async (force = false) => {
      if (typeof window === "undefined" || hasUpdate || isCheckingRef.current) return;

      const now = Date.now();
      const minCooldown = force ? 1500 : 5000;
      if (now - lastCheckTimeRef.current < minCooldown) {
        return;
      }
      lastCheckTimeRef.current = now;
      isCheckingRef.current = true;

      try {
        // 1. Checa se o Service Worker encontrou uma nova versão
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.update().catch(() => {});
              if (registration.waiting) {
                waitingWorkerRef.current = registration.waiting;
                setHasUpdate(true);
                return;
              }
            }
          } catch {
            // Silencioso em caso de restrição do navegador
          }
        }

        // 2. Checa o endpoint de versão com cache-buster (detecta commits/deploys novos na hora)
        const response = await fetch(`/api/version?_t=${now}`, {
          cache: "no-store",
          headers: {
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          const data = (await response.json()) as { version?: string };
          const serverVersion = data.version;

          if (serverVersion && serverVersion !== "dev") {
            if (!baseVersionRef.current) {
              // Registra versão inicial no primeiro fetch
              baseVersionRef.current = serverVersion;
            } else if (
              serverVersion !== baseVersionRef.current ||
              (CURRENT_VERSION !== "dev" && serverVersion !== CURRENT_VERSION)
            ) {
              if (navigator.vibrate) {
                try {
                  navigator.vibrate([70, 40, 70]);
                } catch {
                  // ignore
                }
              }
              setHasUpdate(true);
            }
          }
        }
      } catch {
        // Ignora falhas pontuais de conexão
      } finally {
        isCheckingRef.current = false;
      }
    },
    [hasUpdate]
  );

  // A) Checa ao sair e voltar do aplicativo (visibilidade, foco, pageshow no mobile)
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    function handleTrigger(force = true) {
      checkForUpdate(force);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        handleTrigger(true);
      }
    }

    function handlePageShow() {
      handleTrigger(true);
    }

    function handleFocus() {
      handleTrigger(true);
    }

    function handleResume() {
      handleTrigger(true);
    }

    function handleScreenChange() {
      handleTrigger(true);
    }

    function handleDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.("a") ||
        target?.closest?.(".stitch-nav-item") ||
        target?.closest?.(".stitch-drawer-link") ||
        target?.closest?.("button")
      ) {
        handleTrigger(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("resume", handleResume);
    window.addEventListener("app:screenchange", handleScreenChange);
    window.addEventListener("hashchange", handleScreenChange);
    window.addEventListener("popstate", handleScreenChange);
    document.addEventListener("click", handleDocClick, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("resume", handleResume);
      window.removeEventListener("app:screenchange", handleScreenChange);
      window.removeEventListener("hashchange", handleScreenChange);
      window.removeEventListener("popstate", handleScreenChange);
      document.removeEventListener("click", handleDocClick);
    };
  }, [checkForUpdate]);

  // B) Checa ao mudar de tela (navegação de rotas no Next.js)
  useEffect(() => {
    checkForUpdate(true);
  }, [pathname, checkForUpdate]);

  // C) Checagem periódica rápida em segundo plano (a cada 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdate(false);
    }, AUTO_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkForUpdate]);

  // D) Monitoramento direto do ciclo de vida do Service Worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    function listenRegistration(reg: ServiceWorkerRegistration) {
      if (reg.waiting) {
        waitingWorkerRef.current = reg.waiting;
        setHasUpdate(true);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = newWorker;
            setHasUpdate(true);
          }
        });
      });
    }

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg) listenRegistration(reg);
      })
      .catch(() => {});
  }, []);

  function handleApplyUpdate() {
    setIsUpdating(true);

    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    }

    // Limpa caches locais do navegador
    if (typeof window !== "undefined" && "caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }

    // Força recarregamento limpo do app para puxar a nova versão
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 200);
  }

  if (!hasUpdate) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes slideUpFadeUpdate {
          from {
            opacity: 0;
            transform: translate(-50%, 16px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes spinUpdate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
      <aside
        className="stitch-update-prompt"
        role="alert"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "clamp(16px, 3.5vw, 28px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 11000,
          maxWidth: "min(calc(100vw - 32px), 360px)",
          width: "max-content",
          background: "linear-gradient(135deg, #530017 0%, #3e0011 100%)",
          border: "1.5px solid #d4ab48",
          borderRadius: "9999px",
          boxShadow: "0 10px 30px rgba(45, 0, 14, 0.45), 0 2px 10px rgba(0, 0, 0, 0.25)",
          color: "#fff7e8",
          padding: "7px 8px 7px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          animation: "slideUpFadeUpdate 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-fashion, serif)",
            fontSize: "13.5px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "#fff7e8",
            whiteSpace: "nowrap",
          }}
        >
          Nova Versão Disponível
        </span>

        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          aria-label="Atualizar aplicativo"
          title="Atualizar aplicativo"
          style={{
            display: "grid",
            placeItems: "center",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f5e4bf 0%, #dfbe75 100%)",
            color: "#430014",
            border: "1px solid #c79a36",
            cursor: isUpdating ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.16s ease, filter 0.16s ease",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              animation: isUpdating ? "spinUpdate 0.85s linear infinite" : undefined,
              lineHeight: 1,
              display: "inline-block",
            }}
          >
            sync
          </span>
        </button>
      </aside>
    </>
  );
}
