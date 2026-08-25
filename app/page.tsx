"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import "./signup-form.css";
import { formatName, formatPhone, cleanPhone } from "@/utils/formatters";
import { APP_CONFIG } from "@/constants/config";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import { FastLookupModal } from "@/components/public/FastLookupModal";
import { LojistaGateModal } from "@/components/public/LojistaGateModal";
import type { UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";

const HERO_IMAGE_URL = "/renata-hero.jpg";

interface FieldErrors {
  name?: string;
  store?: string;
  phone?: string;
  instagram?: string;
  consent?: string;
}

export default function Home() {
  const {
    savedParticipant,
    saveParticipant,
    lookupByPhone,
  } = useSavedParticipant();

  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Controlled form state
  const [userType, setUserType] = useState<UserType>("lojista");
  const [name, setName] = useState("");
  const [store, setStore] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [consent, setConsent] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const instagramInputRef = useRef<HTMLInputElement>(null);
  const consentInputRef = useRef<HTMLInputElement>(null);

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

  function validateForm(): { isValid: boolean; errors: FieldErrors } {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedStore = store.trim();
    const cleanedPhone = cleanPhone(phone);
    const cleanedInstagram = instagram.trim().replace(/^@?/, "");

    if (!trimmedName || trimmedName.length < 3) {
      errors.name = "Informe seu nome completo (mínimo 3 caracteres).";
    }

    if (!trimmedStore || trimmedStore.length < 2) {
      errors.store = "Informe o nome da sua loja ou marca.";
    }

    if (!cleanedPhone || cleanedPhone.length < 10) {
      errors.phone = "Informe um WhatsApp válido com DDD (ex: 11 98765-4321).";
    }

    if (!cleanedInstagram || cleanedInstagram.length < 2) {
      errors.instagram = "Informe o usuário do Instagram da loja.";
    }

    if (!consent) {
      errors.consent = "É necessário aceitar os termos para participar do sorteio.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGlobalError("");

    if (!registrationsOpen) {
      setGlobalError("As inscrições para este sorteio estão temporariamente encerradas.");
      return;
    }

    const { isValid, errors } = validateForm();
    if (!isValid) {
      setFieldErrors(errors);
      // Focus first invalid field
      if (errors.name) nameInputRef.current?.focus();
      else if (errors.store) storeInputRef.current?.focus();
      else if (errors.phone) phoneInputRef.current?.focus();
      else if (errors.instagram) instagramInputRef.current?.focus();
      else if (errors.consent) consentInputRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const response = await fetch(APP_CONFIG.api.participants, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          store: store.trim(),
          phone: cleanPhone(phone),
          instagram: `@${instagram.trim().replace(/^@?/, "")}`,
          userType,
          consent: true,
        }),
      });

      const result = (await response.json()) as {
        participant?: {
          id: number;
          luckyNumber: string;
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
      window.location.assign(
        result.duplicate ? APP_CONFIG.routes.duplicate : APP_CONFIG.routes.success,
      );
    } catch (err) {
      setGlobalError(
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
      window.location.assign(APP_CONFIG.routes.success);
    }
  }

  return (
    <main className="signup-page">
      <a
        className="signup-admin-pill"
        href="/admin"
        aria-label="Acessar painel da organização"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          admin_panel_settings
        </span>
        <span className="signup-admin-text">Área da Organização</span>
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
            Concorra a um Provador Fashion da <em>Renata Castanheira</em> para sua loja.
          </h2>
          <p>
            {registrationsOpen
              ? "Provador de 5 looks a serem enviados. Preencha seus dados de lojista abaixo para gerar seu número da sorte exclusivo."
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
              <a href="/sucesso" className="signup-submit-btn">
                <span>Acessar Meu Comprovante &amp; Alerta</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </a>
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
          <form className="signup-form" onSubmit={submit} noValidate>
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

            {/* Seletor de Tipo de Participante */}
            <div className="signup-profile-selector">
              <label className="profile-selector-title">Selecione seu perfil no evento:</label>
              <div className="profile-types-grid">
                {(["lojista", "influencer", "visitante", "vip"] as UserType[]).map((type) => {
                  const isSelected = userType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`profile-type-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setUserType(type)}
                    >
                      <span className="material-symbols-outlined">{USER_TYPE_ICONS[type]}</span>
                      <span>{USER_TYPE_LABELS[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="signup-fields-grid">
              <div className="signup-field-group">
                <label htmlFor="signup-name">Nome completo</label>
                <input
                  ref={nameInputRef}
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  placeholder="Ex: Renata Castanheira"
                  value={name}
                  onChange={(e) => {
                    setName(formatName(e.target.value));
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "signup-name-error" : undefined}
                  disabled={loading}
                />
                {fieldErrors.name && (
                  <span id="signup-name-error" className="field-error-message" role="alert">
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div className="signup-field-group">
                <label htmlFor="signup-store">
                  {userType === "lojista"
                    ? "Nome da loja ou marca"
                    : userType === "influencer"
                      ? "Seu nicho / canal / agência"
                      : userType === "vip"
                        ? "Empresa ou convidado por"
                        : "Cidade / Empresa"}
                </label>
                <input
                  ref={storeInputRef}
                  id="signup-store"
                  name="store"
                  autoCapitalize="words"
                  placeholder={
                    userType === "lojista"
                      ? "Ex: Boutique Elegance"
                      : userType === "influencer"
                        ? "Ex: Moda & Estilo / Canal @estilo"
                        : userType === "vip"
                          ? "Ex: Convidado Especial"
                          : "Ex: São Paulo / Compradora"
                  }
                  value={store}
                  onChange={(e) => {
                    setStore(e.target.value);
                    if (fieldErrors.store) setFieldErrors((prev) => ({ ...prev, store: undefined }));
                  }}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.store)}
                  aria-describedby={fieldErrors.store ? "signup-store-error" : undefined}
                  disabled={loading}
                />
                {fieldErrors.store && (
                  <span id="signup-store-error" className="field-error-message" role="alert">
                    {fieldErrors.store}
                  </span>
                )}
              </div>

              <div className="signup-field-group">
                <label htmlFor="signup-phone">WhatsApp</label>
                <input
                  ref={phoneInputRef}
                  id="signup-phone"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value));
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? "signup-phone-error" : "signup-phone-hint"
                  }
                  disabled={loading}
                />
                {fieldErrors.phone ? (
                  <span id="signup-phone-error" className="field-error-message" role="alert">
                    {fieldErrors.phone}
                  </span>
                ) : (
                  <small id="signup-phone-hint" className="signup-field-hint">
                    <span className="material-symbols-outlined">info</span>
                    Apenas 1 número por WhatsApp
                  </small>
                )}
              </div>

              <div className="signup-field-group">
                <label htmlFor="signup-instagram">Instagram da Loja</label>
                <div className={`signup-instagram-wrap${fieldErrors.instagram ? " is-invalid" : ""}`}>
                  <span aria-hidden="true">@</span>
                  <input
                    ref={instagramInputRef}
                    id="signup-instagram"
                    name="instagram"
                    placeholder="sualoja"
                    autoComplete="off"
                    value={instagram}
                    onChange={(e) => {
                      setInstagram(e.target.value.replace(/^@/, ""));
                      if (fieldErrors.instagram) setFieldErrors((prev) => ({ ...prev, instagram: undefined }));
                    }}
                    required
                    aria-label="Usuário do Instagram"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.instagram)}
                    aria-describedby={fieldErrors.instagram ? "signup-instagram-error" : undefined}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.instagram && (
                  <span id="signup-instagram-error" className="field-error-message" role="alert">
                    {fieldErrors.instagram}
                  </span>
                )}
              </div>
            </div>

            <label className="signup-consent-card" htmlFor="signup-consent">
              <input
                ref={consentInputRef}
                id="signup-consent"
                type="checkbox"
                name="consent"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (fieldErrors.consent) setFieldErrors((prev) => ({ ...prev, consent: undefined }));
                }}
                required
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.consent)}
                aria-describedby={fieldErrors.consent ? "signup-consent-error" : undefined}
                disabled={loading}
              />
              <span>
                Autorizo o uso dos meus dados para participação no sorteio e
                comunicações exclusivas do <strong>Fashion Date</strong>.
              </span>
            </label>
            {fieldErrors.consent && (
              <span id="signup-consent-error" className="field-error-message" style={{ marginTop: "-10px", display: "block" }} role="alert">
                {fieldErrors.consent}
              </span>
            )}

            {globalError && (
              <div className="form-error-card" role="alert" aria-live="assertive">
                <span className="material-symbols-outlined">error</span>
                <span>{globalError}</span>
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

      <LojistaGateModal onEligible={() => {}} />
    </main>
  );
}
