import type { ToastMessage } from "@/types/admin.types";

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  const isError = message.type === "error";

  return (
    <div
      className={`app-toast ${isError ? "error" : "success"}`}
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined">
        {isError ? "error" : "check_circle"}
      </span>
      <p>{message.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar notificação"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
