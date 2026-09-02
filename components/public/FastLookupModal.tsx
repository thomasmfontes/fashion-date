"use client";

import { useState, type FormEvent } from "react";
import { formatPhone, cleanPhone } from "@/utils/formatters";
import { isValidPhone } from "@/utils/validators";
import { Modal } from "@/components/ui/Modal";
import "./fast-lookup.css";

interface FastLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLookup: (phone: string) => Promise<void>;
}

export function FastLookupModal({
  isOpen,
  onClose,
  onLookup,
}: FastLookupModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("Por favor, digite um WhatsApp válido com DDD.");
      return;
    }

    setLoading(true);
    try {
      await onLookup(cleanPhone(phone));
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Inscrição não encontrada. Verifique o número digitado.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="fast-lookup-modal"
      isBusy={loading}
    >
      <div className="lookup-header-wrap">
        <div className="lookup-badge-pill">
          <span className="material-symbols-outlined">wallet</span>
          <span>Acesso Rápido</span>
        </div>
        <h2 className="lookup-title">Acessar Minha Carteira</h2>
      </div>

      <p className="lookup-description-text">
        Já se cadastrou no <strong>Fashion Date</strong>? Digite seu WhatsApp para recuperar seus dados e visualizar todos os seus bilhetes de sorteio neste aparelho.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="lookup-field-container">
          <label htmlFor="lookup-phone" className="lookup-field-label">
            WhatsApp Cadastrado
          </label>
          <div className={`lookup-input-box${error ? " is-invalid" : ""}`}>
            <span className="material-symbols-outlined icon">call</span>
            <input
              id="lookup-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 98765-4321"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhone(e.target.value));
                if (error) setError("");
              }}
              required
              disabled={loading}
              aria-invalid={Boolean(error)}
            />
          </div>

          {error && (
            <div className="lookup-error-inline" role="alert">
              <span className="material-symbols-outlined">info</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="lookup-modal-footer">
          <button
            type="button"
            className="lookup-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="lookup-btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">search</span>
                <span>Acessar Carteira</span>
              </>
            )}
          </button>
        </footer>
      </form>
    </Modal>
  );
}


