"use client";

import { useState, type FormEvent } from "react";
import type { Participant } from "@/types/participant.types";
import { formatName, formatPhone, cleanPhone, formatInstagram } from "@/utils/formatters";
import { Modal } from "@/components/ui/Modal";

interface EditParticipantModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id: number;
    name: string;
    store: string;
    phone: string;
    instagram: string;
  }) => Promise<void>;
}

function EditFormContent({
  participant,
  onClose,
  onSave,
}: {
  participant: Participant;
  onClose: () => void;
  onSave: EditParticipantModalProps["onSave"];
}) {
  const [name, setName] = useState(participant.name);
  const [store, setStore] = useState(participant.store);
  const [phone, setPhone] = useState(formatPhone(participant.phone));
  const [instagram, setInstagram] = useState(formatInstagram(participant.instagram));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      await onSave({
        id: participant.id,
        name: name.trim(),
        store: store.trim(),
        phone: cleanPhone(phone),
        instagram: formatInstagram(instagram),
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar alterações.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Editar Cadastro"
      badge={
        <span className="edit-ticket-badge">
          Número da Sorte: <strong>#{participant.luckyNumber}</strong>
        </span>
      }
      isBusy={isSaving}
    >
      <form onSubmit={handleSubmit} className="edit-form-inner">
        <div className="edit-fields">
          <label htmlFor="edit-name">
            <span>Nome do Lojista</span>
            <input
              id="edit-name"
              value={name}
              autoCapitalize="words"
              placeholder="Ex: Maria Clara Santos"
              onChange={(e) => setName(formatName(e.target.value))}
              required
              disabled={isSaving}
            />
          </label>
          <label htmlFor="edit-store">
            <span>Nome da Loja</span>
            <input
              id="edit-store"
              value={store}
              placeholder="Ex: Boutique Elegance"
              onChange={(e) => setStore(e.target.value)}
              required
              disabled={isSaving}
            />
          </label>
          <label htmlFor="edit-phone">
            <span>WhatsApp</span>
            <input
              id="edit-phone"
              inputMode="tel"
              placeholder="(11) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
              disabled={isSaving}
            />
          </label>
          <label htmlFor="edit-instagram">
            <span>Instagram</span>
            <input
              id="edit-instagram"
              placeholder="@nomedaloja"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              required
              disabled={isSaving}
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <footer className="edit-modal-footer">
          <button
            type="button"
            className="stitch-button outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="stitch-button filled"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="button-spinner" />
                Salvando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check</span>
                Salvar Alterações
              </>
            )}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function EditParticipantModal({
  participant,
  isOpen,
  onClose,
  onSave,
}: EditParticipantModalProps) {
  if (!isOpen || !participant) return null;

  return (
    <EditFormContent
      key={participant.id}
      participant={participant}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
