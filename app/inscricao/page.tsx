"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import "@/app/signup-form.css";
import { formatName, formatPhone, cleanPhone } from "@/utils/formatters";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import type { UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { AuthUserBadge } from "@/components/public/AuthUserBadge";
import { PrivacyPolicyModal } from "@/components/public/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/public/TermsOfUseModal";

const HERO_IMAGE_URL = "/renata-hero.jpg";

interface FieldErrors {
  name?: string;
  store?: string;
  phone?: string;
  instagram?: string;
  consent?: string;
}

export default function InscricaoPage() {
  const router = useRouter();
  const { status, user, isLoading, registrationsOpen } = useAuthGuard();
  const { saveParticipant } = useSavedParticipant();

  // Form Fields State
  const [userType, setUserType] = useState<UserType>("lojista");
  const [name, setName] = useState("");
  const [store, setStore] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [consent, setConsent] = useState(false);

  // Status & Validation
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const isFormDisabled = loading || !registrationsOpen;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const instagramInputRef = useRef<HTMLInputElement>(null);
  const consentInputRef = useRef<HTMLInputElement>(null);

  // Legal Modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Pre-fill user name from authenticated account
  useEffect(() => {
    if (user) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      if (fullName) {
        setName((prev) => prev || formatName(fullName));
      }
    }
  }, [user]);

  // Strict Route Guard for "/inscricao"
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    } else if (status === "authenticated_registered") {
      router.replace("/home");
    }
  }, [status, router]);

  // If redirecting, do not render registration form
  if (status === "unauthenticated" || status === "authenticated_registered") {
    return null;
  }

  // Input Handlers
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(formatName(e.target.value));
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
  }

  function handleInstagramChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInstagram(e.target.value.replace(/^@+/, ""));
    if (fieldErrors.instagram) setFieldErrors((prev) => ({ ...prev, instagram: undefined }));
  }

  function handleConsentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setConsent(e.target.checked);
    if (fieldErrors.consent) setFieldErrors((prev) => ({ ...prev, consent: undefined }));
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const digitsOnly = cleanPhone(phone);
    const trimmedInsta = instagram.trim();

    if (!trimmedName || trimmedName.length < 3) {
      errors.name = "Informe seu nome completo.";
    }

    if (userType === "lojista" || userType === "revendedor") {
      const trimmedStore = store.trim();
      if (!trimmedStore || trimmedStore.length < 2) {
        errors.store = "Informe o nome da loja ou marca.";
      }
    }

    if (!digitsOnly || digitsOnly.length < 10 || digitsOnly.length > 11) {
      errors.phone = "Informe um WhatsApp com DDD válido.";
    }

    if (!trimmedInsta || trimmedInsta.length < 2) {
      errors.instagram = "Informe seu perfil do Instagram.";
    }

    if (!consent) {
      errors.consent = "É necessário aceitar o regulamento para participar.";
    }

    setFieldErrors(errors);

    if (errors.name) nameInputRef.current?.focus();
    else if (errors.store) storeInputRef.current?.focus();
    else if (errors.phone) phoneInputRef.current?.focus();
    else if (errors.instagram) instagramInputRef.current?.focus();
    else if (errors.consent) consentInputRef.current?.focus();

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError("");

    if (!registrationsOpen) {
      setGlobalError("As inscrições estão temporariamente encerradas pela organização.");
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        store: (userType === "lojista" || userType === "revendedor") ? store.trim() : "—",
        phone: cleanPhone(phone),
        instagram: instagram.trim().replace(/^@+/, ""),
        consent,
        userType,
        authUserId: user?.id || null,
        email: user?.email || null,
      };

      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.participant) {
        throw new Error(result.error || "Não foi possível concluir o cadastro.");
      }

      const participantWithAvatar = {
        ...result.participant,
        avatarUrl:
          user?.user_metadata?.avatar_url ||
          user?.user_metadata?.picture ||
          (user?.email
            ? `https://unavatar.io/${encodeURIComponent(user.email.toLowerCase().trim())}?fallback=false`
            : null),
      };
      saveParticipant(participantWithAvatar);
      sessionStorage.setItem("fashion_date_welcome", "true");
      router.replace("/home");
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : "Falha de conexão. Tente novamente.",
      );
      setLoading(false);
    }
  }

  const authenticatedName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    name ||
    "Participante";
  const authenticatedEmail = user?.email || "";
  const authenticatedAvatar = user?.user_metadata?.avatar_url || null;

  return (
    <main className="signup-page">
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
                ? "Preencha seus dados para concluir seu cadastro e receber seus números da sorte."
                : "As inscrições para esta edição foram encerradas pela organização do evento."}
            </p>
          </header>

          {/* Authenticated User Badge */}
          <AuthUserBadge
            name={authenticatedName}
            email={authenticatedEmail}
            avatarUrl={authenticatedAvatar}
            onLoggedOut={() => router.replace("/")}
          />

        {/* The Registration Form */}
        <form
          className="signup-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formulário de Inscrição"
        >
          {/* Seletor de Perfil */}
          <div className="signup-profile-selector">
            <label className="profile-selector-title">Selecione seu perfil no evento:</label>
            <div className="profile-types-grid">
              {(["lojista", "revendedor", "influencer", "visitante"] as UserType[]).map((type) => {
                const isSelected = userType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={isFormDisabled}
                    className={`profile-type-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setUserType(type);
                      if (type !== "lojista" && type !== "revendedor") {
                        setStore("");
                        if (fieldErrors.store) {
                          setFieldErrors((prev) => ({ ...prev, store: undefined }));
                        }
                      }
                    }}
                  >
                    <span className="material-symbols-outlined">{USER_TYPE_ICONS[type]}</span>
                    <span>{USER_TYPE_LABELS[type]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Campos */}
          <div className="signup-fields-grid">
            <div className="signup-field-group">
              <label htmlFor="signup-name">Nome completo *</label>
              <input
                ref={nameInputRef}
                id="signup-name"
                name="name"
                autoComplete="name"
                placeholder="Seu nome e sobrenome"
                value={name}
                onChange={handleNameChange}
                required
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.name)}
                disabled={isFormDisabled}
              />
              {fieldErrors.name && (
                <span id="signup-name-error" className="field-error-message" role="alert">
                  <span className="material-symbols-outlined error-icon" aria-hidden="true">
                    error
                  </span>
                  <span>{fieldErrors.name}</span>
                </span>
              )}
            </div>

            <div className="signup-field-group">
              <label htmlFor="signup-store">
                {userType === "lojista"
                  ? "Nome da loja ou marca *"
                  : userType === "revendedor"
                    ? "Nome da marca / revenda *"
                    : userType === "influencer"
                      ? "Nicho / Agência / Canal (Opcional)"
                      : "Empresa / Cidade (Opcional)"}
              </label>
              <input
                ref={storeInputRef}
                id="signup-store"
                name="store"
                autoCapitalize="words"
                placeholder={
                  userType === "lojista"
                    ? "Ex: Boutique Elegance"
                    : userType === "revendedor"
                      ? "Ex: Bella Moda Revendas"
                      : userType === "influencer"
                        ? "Ex: Moda Evangélica & Lifestyle"
                        : "Ex: São Paulo - SP"
                }
                value={store}
                onChange={(e) => {
                  setStore(e.target.value);
                  if (fieldErrors.store) setFieldErrors((prev) => ({ ...prev, store: undefined }));
                }}
                required={userType === "lojista" || userType === "revendedor"}
                aria-required={userType === "lojista" || userType === "revendedor"}
                aria-invalid={Boolean(fieldErrors.store)}
                disabled={isFormDisabled}
              />
              {fieldErrors.store && (
                <span id="signup-store-error" className="field-error-message" role="alert">
                  <span className="material-symbols-outlined error-icon" aria-hidden="true">
                    error
                  </span>
                  <span>{fieldErrors.store}</span>
                </span>
              )}
            </div>

            <div className="signup-field-group">
              <label htmlFor="signup-phone">WhatsApp *</label>
              <input
                ref={phoneInputRef}
                id="signup-phone"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                required
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.phone)}
                disabled={isFormDisabled}
              />
              {fieldErrors.phone ? (
                <span id="signup-phone-error" className="field-error-message" role="alert">
                  <span className="material-symbols-outlined error-icon" aria-hidden="true">
                    error
                  </span>
                  <span>{fieldErrors.phone}</span>
                </span>
              ) : (
                <small id="signup-phone-hint" className="signup-field-hint">
                  Apenas um cadastro por WhatsApp.
                </small>
              )}
            </div>

            <div className="signup-field-group">
              <label htmlFor="signup-instagram">Instagram *</label>
              <div className={`signup-instagram-wrap${fieldErrors.instagram ? " is-invalid" : ""}`}>
                <span>@</span>
                <input
                  ref={instagramInputRef}
                  id="signup-instagram"
                  name="instagram"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="seu.perfil"
                  value={instagram}
                  onChange={handleInstagramChange}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.instagram)}
                  disabled={isFormDisabled}
                />
              </div>
              {fieldErrors.instagram ? (
                <span id="signup-instagram-error" className="field-error-message" role="alert">
                  <span className="material-symbols-outlined error-icon" aria-hidden="true">
                    error
                  </span>
                  <span>{fieldErrors.instagram}</span>
                </span>
              ) : (
                <small id="signup-instagram-hint" className="signup-field-hint">
                  {userType === "lojista" || userType === "revendedor"
                    ? "Perfil comercial da loja no Instagram."
                    : "Seu perfil pessoal no Instagram."}
                </small>
              )}
            </div>
          </div>

          {/* Termos e Consentimento */}
          <div className="signup-terms-group">
            <div className={`signup-terms-box${fieldErrors.consent ? " is-invalid" : ""}`}>
              <label className="signup-terms-label">
                <input
                  ref={consentInputRef}
                  id="signup-consent"
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={handleConsentChange}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.consent)}
                  disabled={isFormDisabled}
                />
                <span className="signup-terms-text">
                  Concordo em participar dos sorteios do <strong>Fashion Date</strong> e autorizo
                  o uso do meu nome e perfil para divulgação dos resultados oficiais do evento. *
                </span>
              </label>
            </div>

            {fieldErrors.consent && (
              <span id="signup-consent-error" className="field-error-message" role="alert">
                <span className="material-symbols-outlined error-icon" aria-hidden="true">
                  error
                </span>
                <span>{fieldErrors.consent}</span>
              </span>
            )}
          </div>

          {globalError && (
            <div className="form-error-card" role="alert" aria-live="assertive">
              <span className="material-symbols-outlined">error</span>
              <span>{globalError}</span>
            </div>
          )}

          <button
            className="signup-submit-btn"
            type="submit"
            disabled={isFormDisabled}
            aria-busy={loading}
            style={!registrationsOpen ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
          >
            <span>
              {loading
                ? "Cadastrando..."
                : !registrationsOpen
                ? "Inscrições Encerradas"
                : "Concluir Cadastro & Ver Sorteios"}
            </span>
            <span className="material-symbols-outlined">
              {!registrationsOpen ? "lock" : "arrow_forward"}
            </span>
          </button>
        </form>

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
