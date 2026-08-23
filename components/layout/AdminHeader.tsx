import { DrawTransitionLink } from "@/components/admin/DrawTransitionLink";

interface AdminHeaderProps {
  registrationsOpen: boolean;
  onToggleRegistrations: () => void;
}

export function AdminHeader({
  registrationsOpen,
  onToggleRegistrations,
}: AdminHeaderProps) {
  return (
    <header className="stitch-header">
      <div>
        <h1>Painel Fashion Date</h1>
        <span
          className={`stitch-status ${registrationsOpen ? "open" : "closed"}`}
          role="status"
          aria-live="polite"
        >
          <i />
          Inscrições {registrationsOpen ? "Abertas" : "Encerradas"}
        </span>
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
        <DrawTransitionLink className="stitch-button filled">
          <span className="material-symbols-outlined">play_arrow</span>
          Iniciar Sorteio
        </DrawTransitionLink>
      </div>
    </header>
  );
}
