"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./signup-form.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import { participantService } from "@/services/participantService";
import { ApiError } from "@/services/apiClient";
import { formatPhone, cleanPhone } from "@/utils/formatters";
import { SocialAuthGate } from "@/components/public/SocialAuthGate";
import { PrivacyPolicyModal } from "@/components/public/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/public/TermsOfUseModal";

const HERO_IMAGE_URL = "/renata-hero.jpg";

export default function RootLandingPage() {
  const router = useRouter();
  const { status, isLoading, registrationsOpen } = useAuthGuard();
  const { savedParticipant, saveParticipant, clearParticipant } = useSavedParticipant();

  // Phone-First form state
  const [phone, setPhone] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showSwitchPhone, setShowSwitchPhone] = useState(false);

  // Legal Modals State
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Synchronize modal state with URL hash
  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleHashOrQuery() {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      if (hash === "#privacidade" || params.get("modal") === "privacidade") {
        setIsPrivacyOpen(true);
      } else if (hash === "#termos" || params.get("modal") === "termos") {
        setIsTermsOpen(true);
      }
    }

    handleHashOrQuery();
    window.addEventListener("hashchange", handleHashOrQuery);
    return () => window.removeEventListener("hashchange", handleHashOrQuery);
  }, []);

  // Strict Routing Rules for "/"
  useEffect(() => {
    if (status === "authenticated_registered") {
      router.replace("/home");
    } else if (status === "authenticated_unregistered") {
      router.replace("/inscricao");
    }
  }, [status, router]);

  if (status === "authenticated_registered" || status === "authenticated_unregistered") {
    return null;
  }

  const isRecognized = Boolean(savedParticipant?.phone && !showSwitchPhone);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = cleanPhone(phone);
    if (!raw || raw.length < 10 || raw.length > 11) {
      setPhoneError("Informe um WhatsApp com DDD válido.");
      return;
    }

    setPhoneError(null);
    setIsChecking(true);

    try {
      const res = await participantService.lookupByPhone(raw);
      if (res?.participant) {
        saveParticipant(res.participant);
        router.push("/home");
        return;
      }
      router.push(`/inscricao?phone=${encodeURIComponent(raw)}`);
      return;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        // Não cadastrado ainda: leva para preencher o formulário com o telefone já preenchido
        router.push(`/inscricao?phone=${encodeURIComponent(raw)}`);
        return;
      }
      setIsChecking(false);
      setPhoneError(
        err instanceof Error
          ? err.message
          : "Erro ao consultar WhatsApp. Verifique sua conexão e tente novamente.",
      );
    }
  }

  return (
    <main className="signup-page">
      <a
        className="signup-admin-pill"
        href="/admin"
        title="Área da Organização"
        aria-label="Acessar painel da organização"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          admin_panel_settings
        </span>
      </a>

      {/* Left Column: Luxury Brand Visual */}
      <section
        className="signup-visual"
        aria-label="Apresentação do Fashion Date"
      >
        <img
          className="signup-visual-bg"
          src={HERO_IMAGE_URL}
          alt="Renata Castanheira no Fashion Date Crente Chic"
          fetchPriority="high"
          decoding="async"
          width={760}
          height={900}
        />
        <div className="signup-shade" aria-hidden="true" />

        <header className="signup-brand-container">
          <img
            src="/fashiondate-logo.png"
            alt="Fashion Date Crente Chic by Renata Castanheira"
            className="signup-brand-img"
          />
        </header>

        <div className="signup-visual-copy">
          <span className="signup-visual-kicker">
            <i /> Fashion Date · 2026
          </span>
          <h1>
            Fashion Date
            <span className="signup-visual-author">
              por <em>Renata Castanheira</em>
            </span>
          </h1>
          <p>
            O maior evento de moda evangélica da América Latina.
          </p>
        </div>

        <div className="signup-edition-badge">
          <span>7ª Edição</span>
        </div>
      </section>

      {/* Right Column: Registration Form Panel */}
      <section className="signup-panel">
        <div className="signup-panel-inner">
          <header className="signup-heading">
            <div className="signup-heading-badges">
              <span
                className={`stitch-status ${registrationsOpen ? "open" : "closed"}`}
                role="status"
              >
                <i aria-hidden="true" />
                {registrationsOpen ? "Inscrições Abertas" : "Inscrições Encerradas"}
              </span>
            </div>

            <h2>
              Participe dos sorteios oficiais do <br />
              <em>Fashion Date</em>.
            </h2>
            <p>
              {registrationsOpen
                ? "Digite seu WhatsApp para conferir seus números da sorte ou fazer sua inscrição."
                : "Inscrições encerradas. Digite seu WhatsApp para consultar seus números."}
            </p>
          </header>

          {/* Social Auth Gate encloses all identification & login methods */}
          <SocialAuthGate
            onOpenTerms={() => setIsTermsOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          >
            {/* Phone-First Identification Card */}
            {isRecognized && savedParticipant ? (
              <div className="signup-recognized-card">
                <span className="signup-recognized-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                    check_circle
                  </span>
                  <span>Participante Reconhecido</span>
                </span>

                <div>
                  <h3 className="signup-recognized-name">{savedParticipant.name}</h3>
                  <p className="signup-recognized-phone">
                    WhatsApp: <strong>{formatPhone(savedParticipant.phone)}</strong>
                    {savedParticipant.store && savedParticipant.store !== "—" ? ` · ${savedParticipant.store}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  className="signup-phone-submit-btn"
                  onClick={() => router.push("/home")}
                >
                  <span>Acessar Meus Números da Sorte</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <button
                  type="button"
                  className="signup-recognized-switch-btn"
                  onClick={() => {
                    clearParticipant();
                    setShowSwitchPhone(true);
                  }}
                >
                  Entrar com outro número de WhatsApp
                </button>
              </div>
            ) : (
              <form className="signup-phone-card" onSubmit={handlePhoneSubmit} noValidate>
                <div className="signup-phone-field">
                  <label htmlFor="landing-phone">Informe seu WhatsApp</label>
                  <div className="signup-phone-input-wrap">
                    <input
                      id="landing-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="signup-phone-input"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => {
                        setPhone(formatPhone(e.target.value));
                        if (phoneError) setPhoneError(null);
                      }}
                      aria-invalid={Boolean(phoneError)}
                      aria-describedby={phoneError ? "landing-phone-error" : undefined}
                      disabled={isChecking}
                    />
                    <button
                      type="submit"
                      className="signup-phone-inline-submit-btn"
                      disabled={isChecking}
                      aria-label="Continuar"
                      title="Continuar"
                    >
                      {isChecking ? (
                        <span className="social-btn-spinner" aria-hidden="true" />
                      ) : (
                        <span className="material-symbols-outlined" aria-hidden="true">
                          arrow_forward
                        </span>
                      )}
                    </button>
                  </div>
                  {phoneError && (
                    <span id="landing-phone-error" className="field-error-message" role="alert">
                      <span className="material-symbols-outlined error-icon" aria-hidden="true">
                        error
                      </span>
                      <span>{phoneError}</span>
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* Haute Couture Symmetrical Divider */}
            <div className="signup-divider">
              <span className="signup-divider-line" />
              <span className="signup-divider-text">ou continue com</span>
              <span className="signup-divider-line" />
            </div>
          </SocialAuthGate>

          <footer className="signup-footer">
            <span>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", verticalAlign: "-2px" }}>
                lock
              </span>{" "}
              Seus dados estão protegidos
            </span>
            <span>© 2026 Fashion Date · Oficial</span>
          </footer>
        </div>
      </section>

      {/* Modais Legais */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <TermsOfUseModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </main>
  );
}
