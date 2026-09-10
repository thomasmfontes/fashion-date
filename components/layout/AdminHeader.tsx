import { DrawTransitionLink } from "@/components/admin/DrawTransitionLink";

interface AdminHeaderProps {
  registrationsOpen: boolean;
  onToggleRegistrations: () => void;
  isLiveSyncActive?: boolean;
}

export function AdminHeader({
  registrationsOpen,
  onToggleRegistrations,
  isLiveSyncActive = true,
}: AdminHeaderProps) {
  return (
    <header className="stitch-header">
      <div>
        <h1>Painel Fashion Date</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
          <span
            className={`stitch-status ${registrationsOpen ? "open" : "closed"}`}
            role="status"
            aria-live="polite"
          >
            <i />
            Inscrições {registrationsOpen ? "Abertas" : "Encerradas"}
          </span>
          {isLiveSyncActive && (
            <span
              className="stitch-status open"
              style={{ fontSize: "11px" }}
              title="Sincronização em tempo real ativa com o banco de dados"
            >
              <i /> Tempo Real
            </span>
          )}
        </div>
      </div>
      <div className="stitch-actions">
        <button
          className={`stitch-button outline ${registrationsOpen ? "" : "reopen"}`}
          type="button"
          onClick={onToggleRegistrations}
        >
          <span className="material-symbols-outlined">
            {registrationsOpen ? "lock" : "lock_open"}
          </span>
          {registrationsOpen ? "Encerrar Inscrições" : "Reabrir Inscrições"}
        </button>
        <DrawTransitionLink className="stitch-button filled" title="Abrir Telão Oficial do Sorteio">
          <span className="material-symbols-outlined">live_tv</span>
          Abrir Telão
        </DrawTransitionLink>
      </div>
    </header>
  );
}
