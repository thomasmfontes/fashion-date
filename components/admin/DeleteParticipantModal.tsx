import { useState } from "react";
import type { Participant } from "@/types/participant.types";

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
    <div
      className="edit-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <section
        className="edit-modal delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
      >
        <header className="edit-modal-header">
          <div>
            <span className="edit-ticket-badge delete">
              Número da Sorte: <strong>#{participant.luckyNumber}</strong>
            </span>
            <h2 id="delete-title">Excluir Cadastro?</h2>
          </div>
          <button
            type="button"
            className="edit-modal-close"
            onClick={onClose}
            aria-label="Fechar confirmação"
            disabled={isDeleting}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

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
      </section>
    </div>
  );
}
