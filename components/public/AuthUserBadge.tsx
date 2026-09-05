"use client";

import { performFullUserLogout } from "@/lib/supabase/client";

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
    await performFullUserLogout(onLoggedOut);
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
          <strong className="auth-user-name">{name || "Participante"}</strong>
          <span className="auth-user-email">{email}</span>
        </div>
      </div>

      <button
        type="button"
        className="auth-user-logout-btn"
        onClick={handleLogout}
        title="Trocar de conta ou sair"
        aria-label="Trocar de conta"
      >
        <span className="material-symbols-outlined" aria-hidden="true">logout</span>
        <span className="auth-user-logout-text">Trocar Conta</span>
      </button>
    </div>
  );
}
