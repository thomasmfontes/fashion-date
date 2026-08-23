"use client";

import { useState, useSyncExternalStore } from "react";

interface LojistaGateModalProps {
  onEligible: () => void;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean {
  try {
    return Boolean(sessionStorage.getItem("fd_lojista_confirmed"));
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return true; // Server renders as confirmed to avoid hydration shift / SSR flash
}

export function LojistaGateModal({ onEligible }: LojistaGateModalProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [step, setStep] = useState<"ask" | "ineligible">("ask");

  const isConfirmed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const isOpen = !isConfirmed && !isDismissed;

  if (!isOpen) return null;

  function handleConfirmYes() {
    try {
      sessionStorage.setItem("fd_lojista_confirmed", "true");
    } catch {
      // storage quota
    }
    setIsDismissed(true);
    onEligible();
  }

  function handleConfirmNo() {
    setStep("ineligible");
  }

  function handleReset() {
    setStep("ask");
  }

  return (
    <div
      className="edit-modal-backdrop gate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
    >
      <div className="edit-modal gate-modal">
        {step === "ask" ? (
          <div className="gate-modal-content">
            <header className="gate-modal-header">
              <div className="gate-brand-wrap">
                <img
                  src="/fashiondate-logo.png"
                  alt="Fashion Date Crente Chic"
                  className="gate-brand-img"
                />
              </div>
              <span className="stitch-status gold gate-status-pill">
                <span className="material-symbols-outlined">verified</span>
                Verificação de Participação
              </span>
              <h2 id="gate-modal-title">
                Você é lojista ou revendedor(a)?
              </h2>
              <p>
                O sorteio do Provador Fashion com a <strong>Renata Castanheira</strong> é uma ação exclusiva para marcas, lojas físicas, lojas online e revendedores(as).
              </p>
            </header>

            <div className="gate-modal-actions">
              <button
                type="button"
                className="gate-btn-yes"
                onClick={handleConfirmYes}
              >
                <span className="material-symbols-outlined">store</span>
                <span>Sim, sou lojista / revendedor(a)</span>
              </button>

              <button
                type="button"
                className="gate-btn-no"
                onClick={handleConfirmNo}
              >
                <span className="material-symbols-outlined">person</span>
                <span>Não sou lojista</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="gate-modal-content gate-ineligible-content">
            <div className="gate-ineligible-icon">
              <span className="material-symbols-outlined">lock</span>
            </div>

            <span className="stitch-status closed gate-status-pill">
              <i />
              Ação Exclusiva para Lojistas
            </span>

            <h2 id="gate-modal-title">
              Obrigado pelo seu interesse!
            </h2>

            <p>
              O sorteio do provador fashion é exclusivo para <strong>lojistas e revendedores</strong>.
            </p>
            <p className="gate-subtext">
              Que bom que você esta por aqui, agora aproveite tudo que rola no Fashion Date!
            </p>

            <div className="gate-modal-actions">
              <a
                href="https://www.instagram.com/fashiondatecrentechic/"
                target="_blank"
                rel="noopener noreferrer"
                className="gate-btn-yes gate-btn-insta-primary"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                <span>Seguir no Instagram @fashiondatecrentechic</span>
              </a>

              <a
                href="https://www.instagram.com/crentechic/"
                target="_blank"
                rel="noopener noreferrer"
                className="gate-btn-no gate-btn-insta-secondary"
              >
                <span className="material-symbols-outlined">person_add</span>
                <span>Seguir Renata Castanheira @crentechic</span>
              </a>

              <button
                type="button"
                className="gate-btn-link"
                onClick={handleReset}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                <span>Sou lojista e cliquei errado</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
