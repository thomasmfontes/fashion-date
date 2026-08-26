"use client";

import { useState, useEffect, type MouseEvent } from "react";
import type { AdminView } from "@/types/admin.types";
import { DrawTransitionLink } from "@/components/admin/DrawTransitionLink";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobileMenuOpen]);

  function handleMobileNav(nextView: AdminView, event?: MouseEvent<HTMLAnchorElement>) {
    setIsMobileMenuOpen(false);
    onNavigate(nextView, event);
  }

  return (
    <>
      {/* =========================================================
          DESKTOP SIDEBAR (Visible only on desktop > 960px)
          ========================================================= */}
      <aside className="stitch-sidebar desktop-only">
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

          <a
            className={`stitch-nav-item${view === "draw-config" ? " active" : ""}`}
            href="/admin"
            onClick={(event) => onNavigate("draw-config", event)}
          >
            <span className="material-symbols-outlined">tune</span>
            <span className="stitch-nav-label">Configurar Sorteio</span>
          </a>

          <DrawTransitionLink className="stitch-nav-item">
            <span className="material-symbols-outlined">live_tv</span>
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

      {/* =========================================================
          MOBILE STICKY TOPBAR (Visible only on mobile/tablet <= 1024px)
          ========================================================= */}
      <header className="stitch-mobile-topbar mobile-only">
        <div className="stitch-brand-wrapper">
          <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
        </div>

        <button
          className="stitch-hamburger-btn"
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menu de navegação"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* =========================================================
          MOBILE SLIDE-OVER DRAWER & BACKDROP (From Left)
          ========================================================= */}
      <div
        className={`stitch-mobile-backdrop ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`stitch-mobile-drawer ${isMobileMenuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de Navegação"
      >
        {/* Drawer Header (Matches standard mobile topbar exactly) */}
        <div className="stitch-drawer-header">
          <div className="stitch-brand-wrapper">
            <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
          </div>

          <button
            className="stitch-drawer-close"
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="stitch-drawer-body">
          <span className="stitch-drawer-label">Menu Administrativo</span>

          <nav className="stitch-drawer-nav">
            <a
              className={`stitch-drawer-link${view === "participants" ? " active" : ""}`}
              href="/admin"
              onClick={(event) => handleMobileNav("participants", event)}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">group</span>
              </span>
              <span className="stitch-drawer-link-text">Participantes</span>
              <span className="stitch-drawer-link-meta">
                <small className="stitch-drawer-badge">{totalParticipants}</small>
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </a>

            <a
              className={`stitch-drawer-link${view === "draw-config" ? " active" : ""}`}
              href="/admin"
              onClick={(event) => handleMobileNav("draw-config", event)}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">tune</span>
              </span>
              <span className="stitch-drawer-link-text">Configurar Sorteio</span>
              <span className="stitch-drawer-link-meta">
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </a>

            <DrawTransitionLink
              className="stitch-drawer-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">live_tv</span>
              </span>
              <span className="stitch-drawer-link-text">Telão Sorteio</span>
              <span className="stitch-drawer-link-meta">
                <span className="stitch-drawer-pill">Ao vivo</span>
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </DrawTransitionLink>

            <a
              className={`stitch-drawer-link${view === "winners" ? " active" : ""}`}
              href="/admin/vencedores"
              onClick={(event) => handleMobileNav("winners", event)}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">workspace_premium</span>
              </span>
              <span className="stitch-drawer-link-text">Vencedores</span>
              <span className="stitch-drawer-link-meta">
                {totalWinners > 0 && (
                  <small className="stitch-drawer-badge gold">{totalWinners}</small>
                )}
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </a>
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="stitch-drawer-footer">
          <div className="stitch-drawer-profile">
            <div className="stitch-drawer-avatar">
              <span className="material-symbols-outlined">shield_person</span>
            </div>
            <div className="stitch-drawer-user-info">
              <strong>Administrador</strong>
              <span>Fashion Date · 2026</span>
            </div>
          </div>

          <button
            className="stitch-drawer-logout-btn"
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onLogout();
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>
    </>
  );
}
