import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | "guest-favorite"
    | "rausch"
    | "teal"
    | "ruby"
    | "forest";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
}) => {
  const variantStyles = {
    "guest-favorite":
      "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] border-[var(--color-brand-primary)] font-bold shadow-xs",
    rausch:
      "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] font-bold",
    teal: "bg-[var(--color-info-bg)] text-[var(--color-brand-primary)] border-[var(--color-info-border)] font-semibold",
    ruby: "bg-[var(--color-accent-ruby-subtle)] text-[var(--color-accent-ruby)] border-[var(--color-accent-ruby)]/30 font-semibold",
    forest:
      "bg-[var(--color-accent-forest-subtle)] text-[var(--color-accent-forest)] border-[var(--color-accent-forest)]/30 font-semibold",
    success:
      "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)] font-medium",
    warning:
      "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning-border)] font-medium",
    error:
      "bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error-border)] font-medium",
    info: "bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info-border)] font-medium",
    neutral:
      "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] font-medium",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
