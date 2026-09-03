"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import "./signup-form.css";
import { formatName, formatPhone, cleanPhone } from "@/utils/formatters";
import { APP_CONFIG } from "@/constants/config";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import type { UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { SocialAuthGate } from "@/components/public/SocialAuthGate";
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

export default function Home() {
  const {
    savedParticipant,
    saveParticipant,
    clearParticipant,
  } = useSavedParticipant();

  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  // Supabase Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Legal Modals State with URL synchronization
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  function openPrivacyModal() {
    setIsPrivacyOpen(true);
    setIsTermsOpen(false);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "#privacidade");
    }
  }

  function openTermsModal() {
    setIsTermsOpen(true);
    setIsPrivacyOpen(false);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "#termos");
    }
  }

  function closeLegalModals() {
    setIsPrivacyOpen(false);
    setIsTermsOpen(false);
    if (typeof window !== "undefined") {
      if (window.location.hash || window.location.search.includes("modal=")) {
        window.history.pushState(null, "", window.location.pathname);
      }
    }
  }

  useEffect(() => {
    function syncModalsFromUrl() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const modalParam = params.get("modal")?.toLowerCase();

      if (
        hash === "#privacidade" ||
        hash === "#politica-de-privacidade" ||
        modalParam === "privacidade"
      ) {
        setIsPrivacyOpen(true);
        setIsTermsOpen(false);
      } else if (
        hash === "#termos" ||
        hash === "#termos-de-uso" ||
        modalParam === "termos"
      ) {
        setIsTermsOpen(true);
        setIsPrivacyOpen(false);
      } else {
        setIsPrivacyOpen(false);
        setIsTermsOpen(false);
      }
    }

    syncModalsFromUrl();
    window.addEventListener("hashchange", syncModalsFromUrl);
    window.addEventListener("popstate", syncModalsFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncModalsFromUrl);
      window.removeEventListener("popstate", syncModalsFromUrl);
    };
  }, []);

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

  // Listen for Supabase Authentication session on mount
  useEffect(() => {
    let active = true;

    // Check for auth errors passed via URL
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get("auth_error");
      if (urlError) {
        setAuthError(decodeURIComponent(urlError));
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        setAuthUser(session.user);
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          "";
        if (fullName) {
          setName((prev) => prev || formatName(fullName));
        }
      }
      setAuthLoading(false);
    });

    // Reactive listener for login / logout events
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setAuthUser(session.user);
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          "";
        if (fullName) {
          setName((prev) => prev || formatName(fullName));
        }
      } else {
        setAuthUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch live draw registration status
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

  function handleUserLogout() {
    clearParticipant();
    setAuthUser(null);
    setName("");
    setStore("");
    setPhone("");
    setInstagram("");
    setConsent(false);
    setShowNewForm(false);
  }

  function validateForm(): { isValid: boolean; errors: FieldErrors } {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedStore = store.trim();
    const cleanedPhone = cleanPhone(phone);
    const cleanedInstagram = instagram.trim().replace(/^@?/, "");
    const isStoreRequired = userType === "lojista" || userType === "revendedor";

    if (!trimmedName || trimmedName.length < 3) {
      errors.name = "Informe seu nome completo (mínimo 3 caracteres).";
    }

    if (isStoreRequired && (!trimmedStore || trimmedStore.length < 2)) {
      errors.store = userType === "revendedor"
        ? "Informe o nome da sua marca ou revenda."
        : "Informe o nome da sua loja ou marca.";
    }

    if (!cleanedPhone || cleanedPhone.length < 10) {
      errors.phone = "Informe um WhatsApp válido com DDD (ex: 11 98765-4321).";
    }

    if (!cleanedInstagram || cleanedInstagram.length < 2) {
      errors.instagram = isStoreRequired
        ? "Informe o Instagram da loja ou marca."
        : "Informe o seu Instagram (@usuario).";
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
          email: authUser?.email || undefined,
          authUserId: authUser?.id || undefined,
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

  const authenticatedName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    name ||
    "Participante";
  const authenticatedEmail = authUser?.email || "";
  const authenticatedAvatar = authUser?.user_metadata?.avatar_url || null;

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
            Participe dos sorteios oficiais do <em>Fashion Date</em>.
          </h2>
          <p>
            {registrationsOpen
              ? "Conecte-se para preencher sua inscrição e concorrer aos prêmios do evento."
              : "As inscrições para os sorteios foram encerradas temporariamente pela organização."}
          </p>
        </header>

        {/* Auth Loading Skeleton */}
        {authLoading ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div className="social-btn-spinner" style={{ width: "32px", height: "32px" }} />
            <span style={{ fontSize: "13px", color: "#786568", fontWeight: 600 }}>
              Verificando autenticação segura...
            </span>
          </div>
        ) : !authUser ? (
          /* Social Auth Gate: Google or Microsoft required before form */
          <SocialAuthGate
            initialError={authError}
            onOpenPrivacy={openPrivacyModal}
            onOpenTerms={openTermsModal}
          />
        ) : (
          /* Authenticated User Experience */
          <>
            {/* Authenticated User Badge with Logout Option */}
            <AuthUserBadge
              name={authenticatedName}
              email={authenticatedEmail}
              avatarUrl={authenticatedAvatar}
              onLoggedOut={handleUserLogout}
            />

            {/* Closed Announcement */}
            {!registrationsOpen && !savedParticipant && (
              <div className="signup-closed-banner" role="alert">
                <span className="material-symbols-outlined">lock_clock</span>
                <h3>Inscrições Temporariamente Encerradas</h3>
                <p>
                  A organização encerrou as inscrições para a apuração do sorteio.
                  Acompanhe o anúncio no telão do evento!
                </p>
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
                  Você já está cadastrado no Fashion Date como{" "}
                  <strong>{USER_TYPE_LABELS[savedParticipant.userType || "lojista"]}</strong>
                  {savedParticipant.store && savedParticipant.store !== "—" ? ` (${savedParticipant.store})` : ""}.
                </p>
                <div className="smart-session-actions">
                  <a href="/sucesso" className="signup-submit-btn">
                    <span>Acessar Minha Carteira de Sorteios</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                  <button
                    type="button"
                    className="smart-session-switch"
                    onClick={clearParticipant}
                  >
                    <span className="material-symbols-outlined">person_add</span>
                    Não é você? Fazer novo cadastro
                  </button>
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
                    Voltar para meu cadastro
                  </button>
                )}

                {/* Seletor de Tipo de Participante */}
                <div className="signup-profile-selector">
                  <label className="profile-selector-title">Selecione seu perfil no evento:</label>
                  <div className="profile-types-grid">
                    {(["lojista", "revendedor", "influencer", "visitante"] as UserType[]).map((type) => {
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
                    <label htmlFor="signup-name">Nome completo *</label>
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
                    <label htmlFor="signup-phone">WhatsApp *</label>
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
                        Usado para envio do comprovante e validação do sorteio.
                      </small>
                    )}
                  </div>

                  <div className="signup-field-group">
                    <label htmlFor="signup-instagram">Instagram *</label>
                    <input
                      ref={instagramInputRef}
                      id="signup-instagram"
                      name="instagram"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="@seu.perfil"
                      value={instagram}
                      onChange={(e) => {
                        setInstagram(e.target.value);
                        if (fieldErrors.instagram) {
                          setFieldErrors((prev) => ({ ...prev, instagram: undefined }));
                        }
                      }}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.instagram)}
                      aria-describedby={
                        fieldErrors.instagram ? "signup-instagram-error" : "signup-instagram-hint"
                      }
                      disabled={loading}
                    />
                    {fieldErrors.instagram ? (
                      <span id="signup-instagram-error" className="field-error-message" role="alert">
                        {fieldErrors.instagram}
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

                <div className="signup-terms-box">
                  <label className="signup-terms-label">
                    <input
                      ref={consentInputRef}
                      id="signup-consent"
                      type="checkbox"
                      name="consent"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (fieldErrors.consent) {
                          setFieldErrors((prev) => ({ ...prev, consent: undefined }));
                        }
                      }}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.consent)}
                      aria-describedby={fieldErrors.consent ? "signup-consent-error" : undefined}
                      disabled={loading}
                    />
                    <span className="signup-terms-text">
                      Concordo em participar dos sorteios do <strong>Fashion Date</strong> e autorizo
                      o uso do meu nome e perfil para divulgação dos resultados oficiais do evento. *
                    </span>
                  </label>
                </div>

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
                  <span>{loading ? "Cadastrando..." : "Concluir Cadastro & Ver Sorteios"}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            ) : null}
          </>
        )}

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

      {/* Modais Legais (Privacidade e Termos) */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={closeLegalModals}
      />
      <TermsOfUseModal
        isOpen={isTermsOpen}
        onClose={closeLegalModals}
      />
    </main>
  );
}
