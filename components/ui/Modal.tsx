import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  isBusy?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  badge,
  children,
  className = "",
  isBusy = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="edit-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div
        className={`edit-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
      >
        <header className="edit-modal-header">
          <div>
            {badge}
            {title && <h2>{title}</h2>}
          </div>
          <button
            type="button"
            className="edit-modal-close"
            onClick={onClose}
            aria-label="Fechar janela"
            disabled={isBusy}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
