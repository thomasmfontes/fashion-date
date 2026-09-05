"use client";

import { useState, useEffect } from "react";
import type { SavedParticipant, UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS } from "@/types/participant.types";
import type { DrawItem } from "@/types/drawCollection.types";
import type { ParticipantTicket } from "@/types/participant.types";
import { TicketsTab } from "./tabs/TicketsTab";
import { LiveTab } from "./tabs/LiveTab";
import { ProfileTab } from "./tabs/ProfileTab";

export type ParticipantTab = "tickets" | "live" | "profile" | "home";

interface ParticipantAppShellProps {
  participant: SavedParticipant | null;
  avatarUrl?: string | null;
  tickets: ParticipantTicket[];
  eligibleDraws: DrawItem[];
  hasTicket: (drawId: string) => boolean;
  getTicket: (drawId: string) => ParticipantTicket | undefined;
  enterDraw: (draw: DrawItem) => Promise<unknown>;
  onLogout: () => void;
}

export function ParticipantAppShell({
  participant,
  avatarUrl,
  tickets,
  eligibleDraws,
  hasTicket,
  getTicket,
  enterDraw,
  onLogout,
}: ParticipantAppShellProps) {
  const [currentTab, setCurrentTab] = useState<ParticipantTab>("tickets");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const resolvedAvatar = !avatarError ? (avatarUrl || participant?.avatarUrl || null) : null;
  const userType: UserType = participant?.userType || "lojista";
  const userTypeLabel = USER_TYPE_LABELS[userType] || "Lojista";

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

  function handleSelectTab(tab: ParticipantTab) {
    const targetTab = tab === "home" ? "tickets" : tab;
    setCurrentTab(targetTab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isTicketsActive = currentTab === "tickets" || currentTab === "home";

  return (
    <div className="stitch-admin">
      {/* =========================================================
          DESKTOP SIDEBAR (> 1024px)
          ========================================================= */}
      <aside className="stitch-sidebar desktop-only">
        <div className="stitch-sidebar-header">
          <div className="stitch-brand-wrapper">
            <img src="/fashiondate-logo.png" alt="Fashion Date Crente Chic" />
          </div>

          <div className="stitch-sidebar-kicker">
            <i />
            <span>Portal do Participante</span>
            <i />
          </div>
        </div>

        <nav className="stitch-sidebar-nav">
          <a
            href="#tickets"
            className={`stitch-nav-item${isTicketsActive ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab("tickets");
            }}
          >
            <span className="material-symbols-outlined">confirmation_number</span>
            <span className="stitch-nav-label">Números da Sorte</span>
            {tickets.length > 0 && (
              <small className="stitch-nav-badge gold">{tickets.length}</small>
            )}
          </a>

          <a
            href="#live"
            className={`stitch-nav-item${currentTab === "live" ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab("live");
            }}
          >
            <span className="material-symbols-outlined">live_tv</span>
            <span className="stitch-nav-label">Telão Sorteio</span>
            <span className="stitch-nav-pill">Ao vivo</span>
          </a>

          <a
            href="#profile"
            className={`stitch-nav-item${currentTab === "profile" ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab("profile");
            }}
          >
            <span className="material-symbols-outlined">badge</span>
            <span className="stitch-nav-label">Meus Dados</span>
          </a>
        </nav>

        <div className="stitch-sidebar-footer">
          <div className="stitch-admin-user">
            <div
              className="stitch-avatar"
              style={{
                fontWeight: 700,
                fontSize: "15px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={participant?.name || "Participante"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                participant?.name?.charAt(0) || "P"
              )}
            </div>
            <div className="stitch-user-info">
              <strong>{participant?.name || "Participante"}</strong>
              <span>
                {userTypeLabel} &middot; {participant?.store && participant.store !== "—" ? participant.store : "Fashion Date"}
              </span>
            </div>
          </div>

          <button
            className="stitch-logout-btn"
            type="button"
            onClick={onLogout}
            title="Encerrar sessão ou trocar de conta"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MOBILE STICKY TOPBAR (<= 1024px)
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
          MOBILE SLIDE-OVER DRAWER & BACKDROP
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
        aria-label="Menu do Participante"
      >
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
          <span className="stitch-drawer-label">Menu do Participante</span>

          <nav className="stitch-drawer-nav">
            <a
              href="#tickets"
              className={`stitch-drawer-link${isTicketsActive ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleSelectTab("tickets");
              }}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">confirmation_number</span>
              </span>
              <span className="stitch-drawer-link-text">Números da Sorte</span>
              <span className="stitch-drawer-link-meta">
                {tickets.length > 0 && (
                  <small className="stitch-drawer-badge gold">{tickets.length}</small>
                )}
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </a>

            <a
              href="#live"
              className={`stitch-drawer-link${currentTab === "live" ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleSelectTab("live");
              }}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">live_tv</span>
              </span>
              <span className="stitch-drawer-link-text">Telão Sorteio</span>
              <span className="stitch-drawer-link-meta">
                <span className="stitch-drawer-pill">Ao vivo</span>
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </a>

            <a
              href="#profile"
              className={`stitch-drawer-link${currentTab === "profile" ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleSelectTab("profile");
              }}
            >
              <span className="stitch-drawer-link-icon">
                <span className="material-symbols-outlined">badge</span>
              </span>
              <span className="stitch-drawer-link-text">Meus Dados</span>
              <span className="stitch-drawer-link-meta">
                <span className="material-symbols-outlined chevron">chevron_right</span>
              </span>
            </a>
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="stitch-drawer-footer">
          <div className="stitch-drawer-profile">
            <div
              className="stitch-drawer-avatar"
              style={{
                overflow: "hidden",
                position: "relative",
              }}
            >
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={participant?.name || "Participante"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-fashion, serif)" }}>
                  {participant?.name?.charAt(0) || "P"}
                </span>
              )}
            </div>
            <div className="stitch-drawer-user-info">
              <strong>{participant?.name || "Participante"}</strong>
              <span>
                {userTypeLabel} &middot; {participant?.store && participant.store !== "—" ? participant.store : "Fashion Date"}
              </span>
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
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
          ========================================================= */}
      <section className="stitch-content">
        {isTicketsActive && (
          <TicketsTab
            participant={participant}
            tickets={tickets}
            eligibleDraws={eligibleDraws}
            hasTicket={hasTicket}
            getTicket={getTicket}
            enterDraw={enterDraw}
            onNavigate={(tab) => handleSelectTab(tab)}
          />
        )}

        {currentTab === "live" && (
          <LiveTab participant={participant} tickets={tickets} />
        )}

        {currentTab === "profile" && (
          <ProfileTab
            participant={participant}
            avatarUrl={resolvedAvatar}
            onLogout={onLogout}
          />
        )}
      </section>
    </div>
  );
}
