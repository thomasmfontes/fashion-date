"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

const CURRENT_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || "dev";
const CHECK_COOLDOWN_MS = 8000; // Mínimo de 8s entre requisições de checagem
const AUTO_CHECK_INTERVAL_MS = 60000; // Checagem periódica a cada 60s

export function AppUpdatePrompt() {
  const pathname = usePathname();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastCheckTimeRef = useRef(0);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // Executa checagem de nova versão no servidor e no Service Worker
  const checkForUpdate = useCallback(async () => {
    if (typeof window === "undefined" || hasUpdate || isDismissed) return;

    const now = Date.now();
    if (now - lastCheckTimeRef.current < CHECK_COOLDOWN_MS) {
      return;
    }
    lastCheckTimeRef.current = now;

    // 1. Checa se o Service Worker encontrou uma nova versão
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Solicita ao navegador buscar por arquivo sw.js atualizado
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
    try {
      const response = await fetch(`/api/version?_t=${now}`, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { version?: string };
        if (
          data.version &&
          CURRENT_VERSION !== "dev" &&
          data.version !== "dev" &&
          data.version !== CURRENT_VERSION
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
    } catch {
      // Ignora falhas pontuais de conexão
    }
  }, [hasUpdate, isDismissed]);

  // A) Checa ao sair e voltar do aplicativo (visibilidade e foco)
  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    }

    function handleWindowFocus() {
      checkForUpdate();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [checkForUpdate]);

  // B) Checa ao mudar de tela (navegação de rotas no Next.js)
  useEffect(() => {
    checkForUpdate();
  }, [pathname, checkForUpdate]);

  // C) Checagem periódica em segundo plano
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdate();
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

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) listenRegistration(reg);
    }).catch(() => {});
  }, []);

  function handleApplyUpdate() {
    setIsUpdating(true);

    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    }

    // Força recarregamento limpo do app para puxar a nova versão
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 250);
  }

  function handleDismiss() {
    setIsDismissed(true);
    // Volta a alertar após 15 minutos se o usuário ainda não tiver atualizado
    setTimeout(() => {
      setIsDismissed(false);
    }, 15 * 60 * 1000);
  }

  if (!hasUpdate || isDismissed) {
    return null;
  }

  return (
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
        width: "min(calc(100vw - 28px), 440px)",
        background: "linear-gradient(135deg, #530017 0%, #3e0011 100%)",
        border: "1.5px solid #d4ab48",
        borderRadius: "14px",
        boxShadow: "0 14px 45px rgba(45, 0, 14, 0.45), 0 2px 10px rgba(0, 0, 0, 0.25)",
        color: "#fff7e8",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        animation: "slideUpFade 0.36s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "rgba(212, 171, 72, 0.2)",
            border: "1px solid rgba(212, 171, 72, 0.4)",
            color: "#e7c275",
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            system_update
          </span>
        </div>

        <div style={{ minWidth: 0, textAlign: "left" }}>
          <strong
            style={{
              display: "block",
              fontFamily: "var(--font-fashion, serif)",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "#fff7e8",
              lineHeight: 1.2,
            }}
          >
            Nova Versão Disponível
          </strong>
          <span
            style={{
              display: "block",
              fontSize: "11.5px",
              color: "#eed8b2",
              marginTop: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Uma atualização foi publicada
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            minHeight: "36px",
            padding: "0 14px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #f5e4bf 0%, #dfbe75 100%)",
            color: "#430014",
            border: "1px solid #c79a36",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            transition: "all 0.16s ease",
          }}
        >
          {isUpdating ? (
            <span>Atualizando...</span>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                refresh
              </span>
              <span>Atualizar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar notificação de atualização"
          title="Fechar"
          style={{
            display: "grid",
            placeItems: "center",
            width: "28px",
            height: "28px",
            background: "transparent",
            border: "none",
            color: "#eed8b2",
            cursor: "pointer",
            borderRadius: "50%",
            padding: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            close
          </span>
        </button>
      </div>
    </aside>
  );
}
