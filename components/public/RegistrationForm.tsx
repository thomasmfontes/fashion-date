import { useState, type FormEvent } from "react";
import type { ParticipantFormData } from "@/types/participant.types";
import { formatName, formatPhone, cleanPhone, formatInstagram } from "@/utils/formatters";
import { isValidName, isValidStore, isValidPhone, isValidInstagram } from "@/utils/validators";

interface RegistrationFormProps {
  onSubmit: (data: ParticipantFormData) => Promise<void>;
  isLoading?: boolean;
  isOpen?: boolean;
}

export function RegistrationForm({
  onSubmit,
  isLoading = false,
  isOpen = true,
}: RegistrationFormProps) {
  const [name, setName] = useState("");
  const [store, setStore] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [consent, setConsent] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!isOpen) {
      setErrorMessage("As inscrições para este sorteio estão temporariamente encerradas.");
      return;
    }

    if (!isValidName(name)) {
      setErrorMessage("Por favor, informe seu nome completo.");
      return;
    }

    if (!isValidStore(store)) {
      setErrorMessage("Por favor, informe o nome da sua loja.");
      return;
    }

    if (!isValidPhone(phone)) {
      setErrorMessage("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }

    if (!isValidInstagram(instagram)) {
      setErrorMessage("Por favor, informe o perfil do Instagram da sua loja.");
      return;
    }

    if (!consent) {
      setErrorMessage("É necessário aceitar os termos do regulamento para participar.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        store: store.trim(),
        phone: cleanPhone(phone),
        instagram: formatInstagram(instagram),
        consent,
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao realizar inscrição. Tente novamente.",
      );
    }
  }

  return (
    <form className="register-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="reg-name">Nome Completo</label>
        <div className="input-icon-wrapper">
          <span className="material-symbols-outlined input-icon">person</span>
          <input
            id="reg-name"
            name="name"
            type="text"
            placeholder="Ex: Maria Clara Santos"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(formatName(e.target.value))}
            required
            disabled={isLoading || !isOpen}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reg-store">Nome da Loja</label>
        <div className="input-icon-wrapper">
          <span className="material-symbols-outlined input-icon">storefront</span>
          <input
            id="reg-store"
            name="store"
            type="text"
            placeholder="Ex: Boutique Elegance"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            required
            disabled={isLoading || !isOpen}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reg-phone">WhatsApp</label>
        <div className="input-icon-wrapper">
          <span className="material-symbols-outlined input-icon">call</span>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="(11) 98765-4321"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            required
            disabled={isLoading || !isOpen}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reg-instagram">Instagram da Loja</label>
        <div className="input-icon-wrapper">
          <span className="material-symbols-outlined input-icon">alternate_email</span>
          <input
            id="reg-instagram"
            name="instagram"
            type="text"
            placeholder="@nomedaloja"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            required
            disabled={isLoading || !isOpen}
          />
        </div>
      </div>

      <div className="form-consent">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={isLoading || !isOpen}
          />
          <span>
            Declaro que sou lojista presente no evento e concordo com o regulamento do sorteio.
          </span>
        </label>
      </div>

      {errorMessage && (
        <div className="form-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        className="primary-button"
        disabled={isLoading || !isOpen}
      >
        {isLoading ? (
          <>
            <span className="button-spinner" />
            <span>Processando Inscrição...</span>
          </>
        ) : !isOpen ? (
          <span>Inscrições Encerradas</span>
        ) : (
          <>
            <span>Garantir Meu Número da Sorte</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </>
        )}
      </button>
    </form>
  );
}
