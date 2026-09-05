"use client";

import "./auth-loading-screen.css";

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({ message = "Conectando sua Conta" }: AuthLoadingScreenProps) {
  return (
    <main
      className="fashion-splash-screen"
      aria-live="polite"
      role="status"
    >
      <style>{`
        @keyframes fdSpinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes splashBeamSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes splashBreathe {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.02); opacity: 1; }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="fashion-splash-ambient" aria-hidden="true" />

      <div className="fashion-splash-content">
        <div className="fashion-splash-logo-wrap">
          <img
            src="/fashiondate-logo.png"
            alt="Fashion Date Crente Chic by Renata Castanheira"
            className="fashion-splash-logo"
          />
        </div>

        <div className="fashion-splash-kicker" aria-hidden="true">
          <i>✦</i>
          <span>Fashion Date &middot; 2026</span>
          <i>✦</i>
        </div>

        {/* Dynamic Dual-Ring Luxury Spinner */}
        <div
          className="fashion-splash-spinner-wrap"
          aria-hidden="true"
          style={{
            position: "relative",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "4px 0",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2.5px solid rgba(201, 155, 54, 0.2)",
              borderTopColor: "#530017",
              borderRightColor: "#dfbe75",
              boxSizing: "border-box",
              animation: "fdSpinner 0.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
            }}
          />
        </div>


        <span className="fashion-splash-status">
          {message}
        </span>
      </div>

      <footer className="fashion-splash-footer">
        <span className="material-symbols-outlined" aria-hidden="true">
          lock
        </span>
        <span>Conexão Segura &middot; Oficial</span>
      </footer>
    </main>
  );
}
