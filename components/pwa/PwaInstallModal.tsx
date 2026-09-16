"use client";

import { useState, useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: "ios" | "android";
  canPromptNative?: boolean;
  onPromptNative?: () => Promise<unknown>;
}

function AppleIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.85-.9.04-2 .6-2.65 1.35-.58.66-.99 1.72-.94 2.76.99.08 1.96-.51 2.58-1.26z" />
    </svg>
  );
}

function SafariShareIcon() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "5px",
        background: "#edf2f7",
        border: "1px solid #cbd5e1",
        verticalAlign: "middle",
        margin: "0 3px",
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0284c7"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </span>
  );
}

function SafariAddIcon() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "5px",
        background: "#fdf8ee",
        border: "1px solid #ebdcc5",
        verticalAlign: "middle",
        margin: "0 3px",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#9a741a" }}>
        add_box
      </span>
    </span>
  );
}

function ChromeDotsIcon() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "5px",
        background: "#edf2f7",
        border: "1px solid #cbd5e1",
        verticalAlign: "middle",
        margin: "0 3px",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#475569" }}>
        more_vert
      </span>
    </span>
  );
}

export function PwaInstallModal({
  isOpen,
  onClose,
  defaultPlatform,
  canPromptNative = false,
  onPromptNative,
}: PwaInstallModalProps) {
  useLockBodyScroll(isOpen);

  const [platform, setPlatform] = useState<"ios" | "android">(defaultPlatform || "ios");

  useEffect(() => {
    if (defaultPlatform) {
      setPlatform(defaultPlatform);
    }
  }, [defaultPlatform]);

  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-backdrop gate-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 99999,
        background: "rgba(35, 12, 17, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="stitch-panel-card"
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "0",
          borderRadius: "20px",
          background: "#ffffff",
          border: "1.5px solid #ebdcc5",
          boxShadow: "0 24px 60px rgba(67, 0, 20, 0.28)",
          overflow: "hidden",
          animation: "stitchModalIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho Limpo e Nobre */}
        <div
          style={{
            padding: "20px 22px 16px",
            background: "linear-gradient(135deg, #fdfbf7 0%, #f7f1e7 100%)",
            borderBottom: "1px solid #ebdcc5",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar guia de instalação"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(83, 0, 23, 0.06)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#530017",
              transition: "background 0.2s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              close
            </span>
          </button>

          <h3
            style={{
              fontFamily: "var(--font-fashion, serif)",
              fontSize: "20px",
              fontWeight: 700,
              color: "#530017",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Instalar no Celular
          </h3>

          {/* Abas Seletoras de SO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              marginTop: "12px",
              background: "rgba(83, 0, 23, 0.05)",
              padding: "3px",
              borderRadius: "9px",
            }}
          >
            <button
              type="button"
              onClick={() => setPlatform("ios")}
              style={{
                border: "none",
                borderRadius: "7px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                fontSize: "12.5px",
                fontWeight: platform === "ios" ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.18s ease",
                background: platform === "ios" ? "#ffffff" : "transparent",
                color: platform === "ios" ? "#530017" : "#786568",
                boxShadow: platform === "ios" ? "0 2px 6px rgba(83, 0, 23, 0.08)" : "none",
              }}
            >
              <AppleIcon size={15} />
              <span>iPhone</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform("android")}
              style={{
                border: "none",
                borderRadius: "7px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                fontSize: "12.5px",
                fontWeight: platform === "android" ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.18s ease",
                background: platform === "android" ? "#ffffff" : "transparent",
                color: platform === "android" ? "#530017" : "#786568",
                boxShadow: platform === "android" ? "0 2px 6px rgba(83, 0, 23, 0.08)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                android
              </span>
              <span>Android</span>
            </button>
          </div>
        </div>

        {/* Conteúdo do Passo a Passo Fluido */}
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {platform === "ios" ? (
            <>
              {/* Passo 1 iOS */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(83, 0, 23, 0.08)",
                    color: "#530017",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45, flex: 1 }}>
                  Abra o Safari e toque no botão de <strong>Compartilhar</strong>
                  <SafariShareIcon />
                  na barra inferior.
                </div>
              </div>

              {/* Passo 2 iOS */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(83, 0, 23, 0.08)",
                    color: "#530017",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45, flex: 1 }}>
                  Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>
                  <SafariAddIcon />.
                </div>
              </div>

              {/* Passo 3 iOS */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(83, 0, 23, 0.08)",
                    color: "#530017",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45, flex: 1 }}>
                  No canto superior direito, toque em <strong>Adicionar</strong> para confirmar.
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Opção direta 1 toque (se suportada) */}
              {canPromptNative && onPromptNative && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#fdfaf6",
                    border: "1px solid #ebdcc5",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#665255" }}>
                    Instalação direta disponível:
                  </span>
                  <button
                    type="button"
                    className="stitch-button filled"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      minHeight: "38px",
                      fontSize: "12.5px",
                      textTransform: "none",
                      borderRadius: "8px",
                    }}
                    onClick={async () => {
                      await onPromptNative();
                      onClose();
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                      download
                    </span>
                    <span>Instalar agora no celular</span>
                  </button>
                </div>
              )}

              {/* Passo 1 Android */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(83, 0, 23, 0.08)",
                    color: "#530017",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45, flex: 1 }}>
                  No Chrome, toque no menu de <strong>três pontos</strong>
                  <ChromeDotsIcon />
                  no canto superior.
                </div>
              </div>

              {/* Passo 2 Android */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(83, 0, 23, 0.08)",
                    color: "#530017",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45, flex: 1 }}>
                  Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                </div>
              </div>

              {/* Passo 3 Android */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(83, 0, 23, 0.08)",
                    color: "#530017",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45, flex: 1 }}>
                  Confirme em <strong>Instalar</strong>. O ícone aparecerá na sua tela.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé Elegante */}
        <div
          style={{
            padding: "12px 22px 18px",
            background: "#ffffff",
            borderTop: "1px solid #ebdcc5",
            display: "flex",
          }}
        >
          <button
            type="button"
            className="stitch-button filled"
            style={{
              width: "100%",
              justifyContent: "center",
              minHeight: "40px",
              borderRadius: "9px",
              textTransform: "none",
              fontSize: "13px",
              letterSpacing: "0.01em",
            }}
            onClick={onClose}
          >
            <span>Entendi, fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
