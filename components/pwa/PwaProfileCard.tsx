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
  const handleAction = () => {
    if (canPromptNative && onPromptNative) {
      onPromptNative();
    } else {
      onOpenGuide();
    }
  };

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
              smartphone
            </span>
            <strong
              style={{ fontSize: "13.5px", color: "#332225", fontWeight: 700 }}
            >
              Aplicativo no Celular
            </strong>
          </div>
        </div>

        {isStandalone && (
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
        )}
      </div>

      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {isStandalone ? (
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
                Aplicativo instalado
              </strong>
              <span style={{ fontSize: "11.5px", color: "#52795d" }}>
                Acesso instantâneo aos seus Números da Sorte direto da tela inicial.
              </span>
            </div>
          </div>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#665255", lineHeight: 1.5 }}>
              Adicione o atalho à tela inicial para abrir seus Números da Sorte com 1 toque no evento.
            </p>

            <button
              type="button"
              onClick={handleAction}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#ffffff",
                cursor: "pointer",
                transition: "all 0.15s ease",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fdfaf6";
                e.currentTarget.style.borderColor = "#c79a36";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#ebdcc5";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px", color: "#9a741a" }}
                >
                  {isIos ? "phone_iphone" : "install_mobile"}
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "#332225",
                    fontWeight: 600,
                  }}
                >
                  {canPromptNative ? "Instalar na Tela Inicial" : "Como adicionar à tela inicial"}
                </span>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: "#9a741a" }}
              >
                chevron_right
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
