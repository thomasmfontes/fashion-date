import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export function Input({
  label,
  error,
  icon,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`stitch-input-group ${error ? "has-error" : ""}`.trim()}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="stitch-input-wrap">
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        <input id={id} className={`stitch-input ${className}`.trim()} {...props} />
      </div>
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}
