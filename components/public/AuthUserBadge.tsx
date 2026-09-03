"use client";

import { signOut } from "@/lib/supabase/client";

interface AuthUserBadgeProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  onLoggedOut?: () => void;
}

export function AuthUserBadge({
  name,
  email,
  avatarUrl,
  onLoggedOut,
}: AuthUserBadgeProps) {
  async function handleLogout() {
    try {
      await signOut();
      if (onLoggedOut) {
        onLoggedOut();
      } else {
        window.location.assign("/");
      }
    } catch {
      window.location.assign("/");
    }
  }

  const initials = (name || email || "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="auth-user-badge-bar">
      <div className="auth-user-info-group">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name || email}
            className="auth-user-avatar"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="auth-user-avatar-initials" aria-hidden="true">
            {initials}
          </div>
        )}

        <div className="auth-user-meta">
          <div className="auth-user-status-pill">
            <span className="auth-user-dot" aria-hidden="true" />
            <span>Conta Autenticada</span>
          </div>
          <strong className="auth-user-name">{name || "Participante"}</strong>
          <span className="auth-user-email">{email}</span>
        </div>
      </div>

      <button
        type="button"
        className="auth-user-logout-btn"
        onClick={handleLogout}
        title="Trocar de conta ou sair"
      >
        <span className="material-symbols-outlined">logout</span>
        <span>Trocar Conta</span>
      </button>
    </div>
  );
}
