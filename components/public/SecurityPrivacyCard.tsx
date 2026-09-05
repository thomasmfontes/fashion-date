"use client";

interface SecurityPrivacyCardProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onDeleteAccount?: () => void;
}

export function SecurityPrivacyCard({
  onOpenTerms,
  onOpenPrivacy,
  onDeleteAccount,
}: SecurityPrivacyCardProps) {
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
              shield
            </span>
            <strong
              style={{ fontSize: "13.5px", color: "#332225", fontWeight: 700 }}
            >
              Segurança & Privacidade
            </strong>
          </div>
        </div>
        <span className="stitch-badge is-active" style={{ fontSize: "9.5px" }}>
          LGPD
        </span>
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
        <div style={{ display: "grid", gap: "10px" }}>
          {/* Botão: Regulamento dos Sorteios */}
          <button
            type="button"
            onClick={onOpenTerms}
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
                description
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  color: "#332225",
                  fontWeight: 600,
                }}
              >
                Regulamento dos Sorteios
              </span>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", color: "#9a741a" }}
            >
              chevron_right
            </span>
          </button>

          {/* Botão: Política de Privacidade */}
          <button
            type="button"
            onClick={onOpenPrivacy}
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
                policy
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  color: "#332225",
                  fontWeight: 600,
                }}
              >
                Política de Privacidade
              </span>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", color: "#9a741a" }}
            >
              chevron_right
            </span>
          </button>

          {/* Ação LGPD: Excluir Meus Dados */}
          {onDeleteAccount && (
            <button
              type="button"
              onClick={onDeleteAccount}
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
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.borderColor = "#f87171";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#ebdcc5";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px", color: "#b91c1c" }}
                >
                  delete
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "#991b1b",
                    fontWeight: 600,
                  }}
                >
                  Excluir Meus Dados
                </span>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: "#b91c1c" }}
              >
                chevron_right
              </span>
            </button>
          )}
        </div>

        {/* Rodapé discreto */}
        <p
          style={{
            margin: 0,
            fontSize: "11.5px",
            color: "#8c787a",
            textAlign: "center",
            lineHeight: "1.45",
          }}
        >
          Seus dados estão protegidos e vinculados exclusivamente aos sorteios oficiais.
        </p>
      </div>
    </div>
  );
}
