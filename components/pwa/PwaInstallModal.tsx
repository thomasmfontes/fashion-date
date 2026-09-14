"use client";

import { useState, useEffect } from "react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: "ios" | "android";
  canPromptNative?: boolean;
  onPromptNative?: () => Promise<unknown>;
}

export function PwaInstallModal({
  isOpen,
  onClose,
  defaultPlatform,
  canPromptNative = false,
  onPromptNative,
}: PwaInstallModalProps) {
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
        {/* Cabeçalho Haute Couture */}
        <div
          style={{
            padding: "22px 24px 18px",
            background: "linear-gradient(135deg, #fdfbf7 0%, #f6efe4 100%)",
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
              width: "32px",
              height: "32px",
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "20px",
                color: "#9a741a",
                background: "rgba(154, 116, 26, 0.12)",
                padding: "6px",
                borderRadius: "8px",
              }}
            >
              install_mobile
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9a741a",
              }}
            >
              Fashion Date App
            </span>
          </div>

          <h3
            style={{
              fontFamily: "var(--font-fashion, serif)",
              fontSize: "22px",
              fontWeight: 700,
              color: "#530017",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Adicionar à Tela de Início
          </h3>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#786568", lineHeight: 1.4 }}>
            Tenha acesso instantâneo aos seus Números da Sorte e aos sorteios em tempo real.
          </p>

          {/* Abas Seletoras de SO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginTop: "16px",
              background: "rgba(83, 0, 23, 0.05)",
              padding: "4px",
              borderRadius: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => setPlatform("ios")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: platform === "ios" ? "#ffffff" : "transparent",
                color: platform === "ios" ? "#530017" : "#786568",
                boxShadow: platform === "ios" ? "0 2px 8px rgba(83, 0, 23, 0.1)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                phone_iphone
              </span>
              iPhone (iOS)
            </button>

            <button
              type="button"
              onClick={() => setPlatform("android")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: platform === "android" ? "#ffffff" : "transparent",
                color: platform === "android" ? "#530017" : "#786568",
                boxShadow: platform === "android" ? "0 2px 8px rgba(83, 0, 23, 0.1)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                android
              </span>
              Android (Chrome)
            </button>
          </div>
        </div>

        {/* Conteúdo do Passo a Passo */}
        <div style={{ padding: "20px 24px", display: "grid", gap: "14px" }}>
          {platform === "ios" ? (
            <>
              {/* Passo 1 iOS */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fdfaf6",
                  border: "1px solid #ebdcc5",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#530017",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45 }}>
                  Abra o Safari e toque no botão de <strong>Compartilhar</strong> na barra inferior.
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginLeft: "6px",
                      verticalAlign: "middle",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      background: "#edf2f7",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Passo 2 iOS */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fdfaf6",
                  border: "1px solid #ebdcc5",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#530017",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45 }}>
                  Role as opções para baixo e toque em{" "}
                  <strong style={{ color: "#530017" }}>Adicionar à Tela de Início</strong>.
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginLeft: "6px",
                      verticalAlign: "middle",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#9a741a" }}>
                      add_box
                    </span>
                  </div>
                </div>
              </div>

              {/* Passo 3 iOS */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fdfaf6",
                  border: "1px solid #ebdcc5",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#530017",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45 }}>
                  No canto superior direito da tela, toque em <strong>Adicionar</strong> para confirmar.
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Android com suporte a 1 toque */}
              {canPromptNative && onPromptNative && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: "rgba(154, 116, 26, 0.08)",
                    border: "1px solid rgba(199, 154, 54, 0.35)",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#530017", fontWeight: 600 }}>
                    Seu aparelho permite instalação direta com 1 toque:
                  </p>
                  <button
                    type="button"
                    className="stitch-button filled"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={async () => {
                      await onPromptNative();
                      onClose();
                    }}
                  >
                    <span className="material-symbols-outlined">download</span>
                    <span>Instalar Agora no Celular</span>
                  </button>
                </div>
              )}

              {/* Passo 1 Android */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fdfaf6",
                  border: "1px solid #ebdcc5",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#530017",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45 }}>
                  No Google Chrome, toque no menu de <strong>três pontos</strong> (canto superior direito).
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      marginLeft: "6px",
                      verticalAlign: "middle",
                      padding: "2px 4px",
                      borderRadius: "6px",
                      background: "#edf2f7",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#334155" }}>
                      more_vert
                    </span>
                  </div>
                </div>
              </div>

              {/* Passo 2 Android */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fdfaf6",
                  border: "1px solid #ebdcc5",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#530017",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45 }}>
                  Toque em <strong style={{ color: "#530017" }}>Instalar aplicativo</strong> ou{" "}
                  <strong style={{ color: "#530017" }}>Adicionar à tela inicial</strong>.
                </div>
              </div>

              {/* Passo 3 Android */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fdfaf6",
                  border: "1px solid #ebdcc5",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#530017",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: "13px", color: "#332225", lineHeight: 1.45 }}>
                  Confirme em <strong>Instalar</strong>. O ícone oficial aparecerá na tela do seu telefone.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé com Ação */}
        <div
          style={{
            padding: "14px 24px 20px",
            background: "#ffffff",
            borderTop: "1px solid #ebdcc5",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="stitch-button filled"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onClose}
          >
            <span className="material-symbols-outlined">check_circle</span>
            <span>Entendi, vou adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
