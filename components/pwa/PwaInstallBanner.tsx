"use client";

interface PwaInstallBannerProps {
  isStandalone: boolean;
  isDismissed: boolean;
  onInstallClick: () => void;
  onDismiss: () => void;
}

export function PwaInstallBanner({
  isStandalone,
  isDismissed,
  onInstallClick,
  onDismiss,
}: PwaInstallBannerProps) {
  if (isStandalone || isDismissed) return null;

  return (
    <div className="stitch-panel-card stitch-pwa-banner">
      <div className="stitch-pwa-banner-content">
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "rgba(154, 116, 26, 0.1)",
            border: "1px solid rgba(199, 154, 54, 0.25)",
            color: "#9a741a",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
            install_mobile
          </span>
        </div>

        <div>
          <h4
            style={{
              margin: "0 0 2px",
              fontFamily: "var(--font-fashion, serif)",
              fontSize: "16px",
              fontWeight: 700,
              color: "#530017",
            }}
          >
            Instale o App Fashion Date
          </h4>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#786568", lineHeight: 1.35 }}>
            Abra seus Números da Sorte com 1 toque no seu celular durante o evento.
          </p>
        </div>
      </div>

      <div className="stitch-pwa-banner-actions">
        <button
          type="button"
          className="stitch-button filled"
          style={{
            fontSize: "12px",
            padding: "8px 16px",
            height: "auto",
            minHeight: "36px",
          }}
          onClick={onInstallClick}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            download
          </span>
          <span>Instalar App</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dispensar aviso de instalação"
          className="stitch-pwa-banner-dismiss"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            close
          </span>
        </button>
      </div>
    </div>
  );
}
