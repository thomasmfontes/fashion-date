"use client";

import { useState, type FormEvent } from "react";
import { formatPhone, cleanPhone } from "@/utils/formatters";
import { isValidPhone } from "@/utils/validators";
import { Modal } from "@/components/ui/Modal";

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
      title="Consultar Meu Número"
      badge={<span className="edit-ticket-badge">Acesso Rápido</span>}
      className="fast-lookup-modal"
      isBusy={loading}
    >
      <p className="lookup-description">
        Já realizou seu cadastro anteriormente? Digite seu WhatsApp para
        acessar seu número da sorte imediatamente neste aparelho.
      </p>

      <form onSubmit={handleSubmit} className="lookup-form">
        <label htmlFor="lookup-phone">
          <span>WhatsApp Cadastrado</span>
          <div className="stitch-input-wrap">
            <span className="material-symbols-outlined">call</span>
            <input
              id="lookup-phone"
              type="tel"
              inputMode="tel"
              placeholder="(11) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
              disabled={loading}
            />
          </div>
        </label>

        {error && <p className="form-error">{error}</p>}

        <footer className="edit-modal-footer">
          <button
            type="button"
            className="stitch-button outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="stitch-button filled"
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
                <span>Acessar Cadastro</span>
              </>
            )}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
