import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outline" | "danger-filled" | "ghost";
  loading?: boolean;
  icon?: string;
}

export function Button({
  children,
  variant = "filled",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "ghost" ? "stitch-button-ghost" : `stitch-button ${variant}`;

  return (
    <button
      className={`${variantClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="button-spinner" />
          <span>Carregando...</span>
        </>
      ) : (
        <>
          {icon && <span className="material-symbols-outlined">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
