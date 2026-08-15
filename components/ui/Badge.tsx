import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "active" | "winner" | "gold" | "pill";
  icon?: string;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "active",
  icon,
  children,
  className = "",
}: BadgeProps) {
  if (variant === "winner") {
    return (
      <span className={`stitch-badge winner ${className}`.trim()}>
        <span className="material-symbols-outlined">workspace_premium</span>
        {children}
      </span>
    );
  }

  if (variant === "active") {
    return (
      <span className={`stitch-badge is-active ${className}`.trim()}>
        <i className="status-dot" />
        {children}
      </span>
    );
  }

  return (
    <span className={`stitch-badge ${variant} ${className}`.trim()}>
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      {children}
    </span>
  );
}
