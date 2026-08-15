import type { MouseEvent } from "react";
import type { AdminView } from "@/types/admin.types";
import { DrawTransitionLink } from "@/app/admin/draw-transition-link";

interface AdminSidebarProps {
  view: AdminView;
  onNavigate: (view: AdminView, event?: MouseEvent<HTMLAnchorElement>) => void;
  totalParticipants: number;
  totalWinners: number;
  onLogout: () => void;
}

export function AdminSidebar({
  view,
  onNavigate,
  totalParticipants,
  totalWinners,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="stitch-sidebar">
      <div className="stitch-sidebar-header">
        <div className="stitch-brand-wrapper">
          <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
        </div>
        <div className="stitch-sidebar-kicker">
          <i />
          <span>Painel Oficial</span>
          <i />
        </div>
      </div>

      <nav className="stitch-sidebar-nav">
        <a
          className={`stitch-nav-item${view === "participants" ? " active" : ""}`}
          href="/admin"
          onClick={(event) => onNavigate("participants", event)}
        >
          <span className="material-symbols-outlined">group</span>
          <span className="stitch-nav-label">Participantes</span>
          <small className="stitch-nav-badge">{totalParticipants}</small>
        </a>

        <DrawTransitionLink className="stitch-nav-item">
          <span className="material-symbols-outlined">confirmation_number</span>
          <span className="stitch-nav-label">Telão Sorteio</span>
          <span className="stitch-nav-pill">Ao vivo</span>
        </DrawTransitionLink>

        <a
          className={`stitch-nav-item${view === "winners" ? " active" : ""}`}
          href="/admin/vencedores"
          onClick={(event) => onNavigate("winners", event)}
        >
          <span className="material-symbols-outlined">workspace_premium</span>
          <span className="stitch-nav-label">Vencedores</span>
          {totalWinners > 0 && (
            <small className="stitch-nav-badge gold">{totalWinners}</small>
          )}
        </a>
      </nav>

      <div className="stitch-sidebar-footer">
        <div className="stitch-admin-user">
          <div className="stitch-avatar">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <div className="stitch-user-info">
            <strong>Administrador</strong>
            <span>Organização · 2026</span>
          </div>
        </div>
        <button
          className="stitch-logout-btn"
          type="button"
          onClick={onLogout}
          title="Encerrar sessão administrativa"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Sair do Painel</span>
        </button>
      </div>
    </aside>
  );
}
