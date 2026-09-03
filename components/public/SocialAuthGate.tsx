"use client";

import { useState } from "react";
import { signInWithGoogle, signInWithMicrosoft } from "@/lib/supabase/client";

interface SocialAuthGateProps {
  initialError?: string | null;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export function SocialAuthGate({
  initialError,
  onOpenPrivacy,
  onOpenTerms,
}: SocialAuthGateProps) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "microsoft" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  async function handleGoogleLogin() {
    try {
      setErrorMessage(null);
      setLoadingProvider("google");
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao conectar com Google. Tente novamente."
      );
      setLoadingProvider(null);
    }
  }

  async function handleMicrosoftLogin() {
    try {
      setErrorMessage(null);
      setLoadingProvider("microsoft");
      await signInWithMicrosoft();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao conectar com Microsoft. Tente novamente."
      );
      setLoadingProvider(null);
    }
  }

  const isBusy = loadingProvider !== null;

  return (
    <div className="social-auth-gate">
      {errorMessage && (
        <div className="social-auth-error" role="alert">
          <span className="material-symbols-outlined">warning</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="social-auth-prompt">
        <span>Escolha como deseja se conectar:</span>
      </div>

      <div className="social-auth-buttons">
        {/* Google OAuth Button */}
        <button
          type="button"
          className="social-btn social-btn-google"
          onClick={handleGoogleLogin}
          disabled={isBusy}
          aria-label="Entrar com conta Google"
        >
          {loadingProvider === "google" ? (
            <span className="social-btn-spinner" aria-hidden="true" />
          ) : (
            <svg
              className="social-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
          )}
          <span className="social-btn-text">
            {loadingProvider === "google" ? "Conectando ao Google..." : "Continuar com Google"}
          </span>
        </button>

        {/* Microsoft OAuth Button */}
        <button
          type="button"
          className="social-btn social-btn-microsoft"
          onClick={handleMicrosoftLogin}
          disabled={isBusy}
          aria-label="Entrar com conta Microsoft"
        >
          {loadingProvider === "microsoft" ? (
            <span className="social-btn-spinner" aria-hidden="true" />
          ) : (
            <svg
              className="social-icon"
              viewBox="0 0 21 21"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
          )}
          <span className="social-btn-text">
            {loadingProvider === "microsoft" ? "Conectando à Microsoft..." : "Continuar com Microsoft"}
          </span>
        </button>
      </div>

      {(onOpenPrivacy || onOpenTerms) && (
        <div className="social-auth-legal-links">
          {onOpenPrivacy && (
            <button
              type="button"
              className="social-auth-legal-btn"
              onClick={onOpenPrivacy}
            >
              Política de Privacidade
            </button>
          )}
          {onOpenPrivacy && onOpenTerms && (
            <span className="social-auth-legal-dot" aria-hidden="true">·</span>
          )}
          {onOpenTerms && (
            <button
              type="button"
              className="social-auth-legal-btn"
              onClick={onOpenTerms}
            >
              Termos de Uso
            </button>
          )}
        </div>
      )}
    </div>
  );
}
