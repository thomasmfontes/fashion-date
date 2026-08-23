"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useId,
} from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  isBusy?: boolean;
  ariaLabel?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  badge,
  children,
  className = "",
  isBusy = false,
  ariaLabel,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Save trigger element and handle Escape & focus containment
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Set initial focus to first input or dialog container
    const timer = window.setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          const firstInput = Array.from(focusable).find(
            (el) => el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA",
          );
          (firstInput || focusable[0]).focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 20);

    // Global KeyDown listener for Escape and Tab trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (triggerRef.current && typeof triggerRef.current.focus === "function") {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, isBusy, onClose]);

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
        ref={modalRef}
        className={`edit-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
      >
        <header className="edit-modal-header">
          <div>
            {badge}
            {title && <h2 id={titleId}>{title}</h2>}
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
