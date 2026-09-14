"use client";

interface PwaProfileCardProps {
  isStandalone: boolean;
  isIos: boolean;
  isAndroid: boolean;
  onOpenGuide: () => void;
  canPromptNative?: boolean;
  onPromptNative?: () => Promise<unknown>;
}

export function PwaProfileCard({
  isStandalone,
  isIos,
  onOpenGuide,
  canPromptNative,
  onPromptNative,
}: PwaProfileCardProps) {
  return (
    <div
      className="stitch-panel-card"
      style={{
        border: "1px solid #ebdcc5",
        borderRadius: "14px",
        background: "#ffffff",
        boxShadow: "0 2px 10px rgba(67, 0, 20, 0.03)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="stitch-controls-header">
        <div className="stitch-header-info">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", color: "#9a741a" }}
            >
              install_mobile
            </span>
            <strong
              style={{ fontSize: "13.5px", color: "#332225", fontWeight: 700 }}
            >
              Aplicativo & Atalho
            </strong>
          </div>
        </div>

        {isStandalone ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "999px",
              background: "#edf7ef",
              border: "1px solid #c7e8cf",
              color: "#1e7239",
              fontSize: "10.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            Instalado
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "999px",
              background: "rgba(154, 116, 26, 0.08)",
              border: "1px solid rgba(154, 116, 26, 0.25)",
              color: "#855e09",
              fontSize: "10.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Navegador
          </span>
        )}
      </div>

      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          gap: "16px",
        }}
      >
        {isStandalone ? (
          <div style={{ display: "grid", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                border: "1px solid #c7e8cf",
                borderRadius: "10px",
                background: "#f7fcf8",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px", color: "#1e7239" }}
              >
                check_circle
              </span>
              <div>
                <strong style={{ fontSize: "12.5px", color: "#1e7239", display: "block" }}>
                  Aplicativo instalado com sucesso
                </strong>
                <span style={{ fontSize: "11.5px", color: "#52795d" }}>
                  Você está acessando em modo tela cheia e com abertura instantânea.
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#786568" }}>Modo de exibição</span>
              <strong style={{ color: "#332225" }}>App Standalone</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#786568" }}>Atualizações</span>
              <strong style={{ color: "#332225" }}>Automáticas em tempo real</strong>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#665255", lineHeight: 1.5 }}>
              Adicione o Fashion Date à tela inicial do seu celular para abrir seus Números da Sorte com 1 toque no evento, sem barra de navegação do navegador.
            </p>

            {canPromptNative && onPromptNative ? (
              <button
                type="button"
                className="stitch-button filled"
                style={{ width: "100%", justifyContent: "center", minHeight: "42px" }}
                onClick={onPromptNative}
              >
                <span className="material-symbols-outlined">download</span>
                <span>Instalar Agora no Celular</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenGuide}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: "1.5px solid #c79a36",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(154, 116, 26, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px", color: "#9a741a" }}
                  >
                    {isIos ? "phone_iphone" : "install_mobile"}
                  </span>
                  <div>
                    <strong style={{ fontSize: "12.5px", color: "#530017", display: "block" }}>
                      Como adicionar à tela inicial
                    </strong>
                    <span style={{ fontSize: "11px", color: "#8a7578" }}>
                      {isIos ? "Guia passo a passo para iPhone (Safari)" : "Guia passo a passo para Android e outros"}
                    </span>
                  </div>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px", color: "#9a741a" }}
                >
                  chevron_right
                </span>
              </button>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px dashed #ebdcc5", paddingTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#9a741a" }}>
            bolt
          </span>
          <span style={{ fontSize: "11px", color: "#8a7578" }}>
            Não ocupa memória como aplicativos pesados de lojas.
          </span>
        </div>
      </div>
    </div>
  );
}
