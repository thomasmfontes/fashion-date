"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatName, formatPhone, cleanPhone } from "@/utils/formatters";
import { APP_CONFIG } from "@/constants/config";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import { FastLookupModal } from "@/components/public/FastLookupModal";

const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLvLCvLUF_CntcplggYaQdDKvcXYz_78xKIcIrBvYjIUpaYmRt2IKM2V87xiHLupjRJiCHOrzHuc0E9_4NB-fi947VXJyzWMRWty25uw-rPDhxrn5acE7JgBKTL08hIBCGrrtVm7ZLN5LSiaolflPHlEwdRWwdeyX1RQv7aLYbi-9tlR1dbcYZXgyWZPXb4xu18tiy_5k7zoB_JrOnm8EgUz4QPzU_sXExoRXUfGUO72MINkpqh3pQn09Q";

export default function Home() {
  const router = useRouter();
  const {
    savedParticipant,
    saveParticipant,
    lookupByPhone,
  } = useSavedParticipant();

  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(APP_CONFIG.api.liveDraw)
      .then((r) => r.json())
      .then((data: { registrationsOpen?: boolean }) => {
        if (active && typeof data.registrationsOpen === "boolean") {
          setRegistrationsOpen(data.registrationsOpen);
        }
      })
      .catch(() => {
        // ignore network error
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registrationsOpen) {
      setError("As inscrições para este sorteio estão temporariamente encerradas.");
      return;
    }

    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(APP_CONFIG.api.participants, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || data.get("name"),
          store: data.get("store"),
          phone: cleanPhone(phone),
          instagram: data.get("instagram"),
          consent: data.get("consent") === "on",
        }),
      });
      const result = (await response.json()) as {
        participant?: {
          id: number;
          luckyNumber: number;
          name: string;
          store: string;
          phone: string;
          instagram: string;
          createdAt: string;
        };
        duplicate?: boolean;
        error?: string;
      };
      if (!response.ok || !result.participant) {
        throw new Error(result.error || "Não foi possível concluir o cadastro.");
      }

      saveParticipant(result.participant);
      router.push(
        result.duplicate ? APP_CONFIG.routes.duplicate : APP_CONFIG.routes.success,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha de conexão. Tente novamente.",
      );
      setLoading(false);
    }
  }

  async function handleFastLookup(lookupPhone: string) {
    const found = await lookupByPhone(lookupPhone);
    if (found) {
      router.push(APP_CONFIG.routes.success);
    }
  }

  return (
    <main className="signup-page">
      <Link
        className="signup-admin-pill"
        href="/admin"
        aria-label="Acessar painel da organização"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          admin_panel_settings
        </span>
        <span>Área da Organização</span>
      </Link>

      {/* Left Column: Luxury Brand Visual */}
      <section
        className="signup-visual"
        aria-label="Apresentação do Fashion Date"
      >
        <img
          className="signup-visual-bg"
          src={HERO_IMAGE_URL}
          alt="Desfile de moda e atmosfera elegante no Fashion Date Crente Chic"
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
            Moda, propósito
            <br />e <em>experiência.</em>
          </h1>
          <p>
            Um encontro exclusivo pensado para lojistas que movimentam a moda com
            identidade e autoridade.
          </p>
        </div>

        <div className="signup-edition-badge">
          <strong>01</strong>
          <span>
            Primeira
            <br />
            Edição Oficial
          </span>
        </div>
      </section>

      {/* Right Column: Registration Form Panel */}
      <section className="signup-panel">
        <header className="signup-heading">
          <div className="signup-heading-badges">
            <span className="stitch-status gold">
              <span className="material-symbols-outlined">workspace_premium</span>
              Sorteio Exclusivo
            </span>
            <span
              className={`stitch-status ${registrationsOpen ? "open" : "closed"}`}
              role="status"
            >
              <i aria-hidden="true" />
              Inscrições {registrationsOpen ? "Abertas" : "Encerradas"}
            </span>
          </div>

          <h2>
            Concorra a um
            <br />
            <em>Provador Fashion.</em>
          </h2>
          <p>
            {registrationsOpen
              ? "Preencha seus dados de lojista. Ao finalizar, seu número da sorte exclusivo será gerado instantaneamente."
              : "As inscrições para este sorteio foram encerradas temporariamente pela organização."}
          </p>
        </header>

        {/* Closed Announcement */}
        {!registrationsOpen && !savedParticipant && (
          <div className="signup-closed-banner" role="alert">
            <span className="material-symbols-outlined">lock_clock</span>
            <h3>Inscrições Temporariamente Encerradas</h3>
            <p>
              A organização encerrou as inscrições para a apuração do sorteio.
              Acompanhe o anúncio no telão do evento!
            </p>
            <button
              type="button"
              className="signup-lookup-pill"
              style={{ marginTop: "18px" }}
              onClick={() => setIsLookupOpen(true)}
            >
              <span className="material-symbols-outlined">search</span>
              Já é cadastrado? Consultar meu comprovante
            </button>
          </div>
        )}

        {/* Identified Returning User Card */}
        {savedParticipant && !showNewForm ? (
          <div className="smart-session-card">
            <div className="smart-session-badge">
              <span className="material-symbols-outlined">verified_user</span>
              <span>Inscrição Identificada</span>
            </div>
            <h3>Olá, {savedParticipant.name}!</h3>
            <p>
              Sua loja <strong>{savedParticipant.store}</strong> já está
              cadastrada neste aparelho com o número:
            </p>
            <div className="smart-session-number">
              <span>#{savedParticipant.luckyNumber}</span>
            </div>
            <div className="smart-session-actions">
              <Link href="/sucesso" className="signup-submit-btn">
                <span>Acessar Meu Comprovante &amp; Alerta</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              {registrationsOpen && (
                <button
                  type="button"
                  className="smart-session-switch"
                  onClick={() => setShowNewForm(true)}
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Cadastrar outra pessoa neste celular
                </button>
              )}
            </div>
          </div>
        ) : registrationsOpen ? (
          /* Active Registration Form */
          <form className="signup-form" onSubmit={submit}>
            {savedParticipant && showNewForm && (
              <button
                type="button"
                className="smart-session-switch"
                style={{ marginBottom: "10px" }}
                onClick={() => setShowNewForm(false)}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar para meu cadastro (#{savedParticipant.luckyNumber})
              </button>
            )}

            <div className="signup-fields-grid">
              <div className="signup-field-group">
                <label htmlFor="signup-name">Nome completo</label>
                <input
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  placeholder="Ex: Renata Castanheira"
                  value={name}
                  onChange={(e) => setName(formatName(e.target.value))}
                  required
                  minLength={3}
                  aria-required="true"
                  disabled={loading}
                />
              </div>

              <div className="signup-field-group">
                <label htmlFor="signup-store">Nome da loja</label>
                <input
                  id="signup-store"
                  name="store"
                  autoCapitalize="words"
                  placeholder="Ex: Boutique Elegance"
                  required
                  minLength={2}
                  aria-required="true"
                  disabled={loading}
                />
              </div>

              <div className="signup-field-group">
                <label htmlFor="signup-phone">WhatsApp</label>
                <input
                  id="signup-phone"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  required
                  minLength={14}
                  aria-required="true"
                  aria-describedby="signup-phone-hint"
                  disabled={loading}
                />
                <small id="signup-phone-hint" className="signup-field-hint">
                  <span className="material-symbols-outlined">info</span>
                  Apenas 1 número por WhatsApp
                </small>
              </div>

              <div className="signup-field-group">
                <label htmlFor="signup-instagram">Instagram da Loja</label>
                <div className="signup-instagram-wrap">
                  <span aria-hidden="true">@</span>
                  <input
                    id="signup-instagram"
                    name="instagram"
                    placeholder="sualoja"
                    autoComplete="off"
                    required
                    aria-label="Usuário do Instagram"
                    aria-required="true"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <label className="signup-consent-card" htmlFor="signup-consent">
              <input
                id="signup-consent"
                type="checkbox"
                name="consent"
                required
                aria-required="true"
                disabled={loading}
              />
              <span>
                Autorizo o uso dos meus dados para participação no sorteio e
                comunicações exclusivas do <strong>Fashion Date</strong>.
              </span>
            </label>

            {error && (
              <div className="form-error-card" role="alert" aria-live="assertive">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className="signup-submit-btn"
              type="submit"
              disabled={loading}
              aria-busy={loading}
            >
              <span>{loading ? "Gerando número da sorte..." : "Quero Participar do Sorteio"}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="signup-lookup-section">
              <button
                type="button"
                className="signup-lookup-pill"
                onClick={() => setIsLookupOpen(true)}
              >
                <span className="material-symbols-outlined">search</span>
                <span>Já é cadastrado? Consulte seu número pelo WhatsApp</span>
              </button>
            </div>
          </form>
        ) : null}

        <footer className="signup-footer">
          <span>
            <span className="material-symbols-outlined" style={{ fontSize: "14px", verticalAlign: "-2px" }}>
              lock
            </span>{" "}
            Seus dados estão protegidos
          </span>
          <span>© 2026 Fashion Date · Oficial</span>
        </footer>
      </section>

      <FastLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onLookup={handleFastLookup}
      />
    </main>
  );
}
