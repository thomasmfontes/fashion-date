import { useState, type FormEvent } from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/constants/config";

interface AdminLoginFormProps {
  onLogin: (key: string) => void | Promise<void>;
  error?: string;
}

export function AdminLoginForm({ onLogin, error }: AdminLoginFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setIsSubmitting(true);
    try {
      await onLogin(password.trim());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-portal">
      {/* Return to Public Page */}
      <Link
        href="/"
        className="admin-portal-back"
        aria-label="Voltar para a página inicial"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        <span>Voltar ao Início</span>
      </Link>

      <div className="admin-portal-box">
        {/* Header with Luxury Brand */}
        <header className="admin-portal-header">
          <div className="admin-portal-brand">
            <img
              src="/fashiondate-logo.png"
              alt="Fashion Date Crente Chic"
              className="admin-portal-logo"
            />
          </div>

          <div className="admin-portal-badge">
            <span className="stitch-status gold">
              <span className="material-symbols-outlined">shield</span>
              Acesso da Organização
            </span>
          </div>

          <h1>Painel Administrativo</h1>
          <p>
            Digite a senha de administrador para gerenciar participantes,
            controlar inscrições e comandar o telão do {APP_CONFIG.name}.
          </p>
        </header>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-portal-form">
          <div className="admin-portal-field">
            <label htmlFor="admin-password">Senha Mestra</label>
            <div className="admin-portal-input-group">
              <span className="material-symbols-outlined field-icon">lock</span>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a senha de acesso..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-portal-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error-card" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            className="signup-submit-btn"
            type="submit"
            disabled={isSubmitting || !password.trim()}
          >
            <span>{isSubmitting ? "Autenticando..." : "Acessar Painel"}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        {/* Security Footer Note */}
        <footer className="admin-portal-footer">
          <span className="material-symbols-outlined">verified_user</span>
          <span>Ambiente seguro e restrito à equipe oficial</span>
        </footer>
      </div>
    </main>
  );
}
