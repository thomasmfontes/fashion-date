"use client";

import { useState } from "react";
import type { Participant } from "@/types/participant.types";
import { Modal } from "@/components/ui/Modal";

interface DeleteParticipantModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteParticipantModal({
  participant,
  isOpen,
  onClose,
  onConfirm,
}: DeleteParticipantModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !participant) return null;

  async function handleDelete() {
    if (!participant) return;
    setIsDeleting(true);
    try {
      await onConfirm(participant.id);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Cadastro?"
      badge={
        <span className="edit-ticket-badge delete">
          Número da Sorte: <strong>#{participant.luckyNumber}</strong>
        </span>
      }
      className="delete-modal"
      isBusy={isDeleting}
    >
      <p id="delete-description" className="delete-modal-text">
        Tem certeza que deseja remover <strong>{participant.name}</strong> (
        <em>{participant.store}</em>) da lista? Esta ação não pode ser
        desfeita.
      </p>

      <footer className="edit-modal-footer">
        <button
          type="button"
          className="stitch-button outline"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="stitch-button danger-filled"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <span className="button-spinner" />
              Excluindo...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">delete</span>
              Confirmar Exclusão
            </>
          )}
        </button>
      </footer>
    </Modal>
  );
}
