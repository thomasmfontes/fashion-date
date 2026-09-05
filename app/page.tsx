"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./signup-form.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { SocialAuthGate } from "@/components/public/SocialAuthGate";
import { PrivacyPolicyModal } from "@/components/public/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/public/TermsOfUseModal";

const HERO_IMAGE_URL = "/renata-hero.jpg";

export default function RootLandingPage() {
  const router = useRouter();
  const { status, isLoading, registrationsOpen } = useAuthGuard();

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
                ? "Conecte-se para preencher sua inscrição e concorrer aos prêmios do evento."
                : "Inscrições de novos participantes encerradas. Já cadastrado? Conecte-se para ver seus números da sorte."}
            </p>
          </header>

          {/* Social Auth Gate (Google / Microsoft) */}
          <SocialAuthGate
            onOpenTerms={() => setIsTermsOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />

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
