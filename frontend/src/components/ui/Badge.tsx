import React from "react";
import { useTheme } from "@theme/index";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "guest-favorite" | "rausch" | "teal" | "ruby" | "forest";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
}) => {
  const { darkMode } = useTheme();

  const variantStyles = {
    "guest-favorite": darkMode
      ? "bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--brand-primary)] font-bold shadow-sm"
      : "bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-main)] font-bold shadow-sm",
    rausch: "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] font-bold",
    teal: "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/30 font-semibold",
    ruby: "bg-[var(--accent-ruby)]/15 text-[var(--accent-ruby)] border-[var(--accent-ruby)]/30 font-semibold",
    forest: "bg-[var(--accent-forest)]/15 text-[var(--accent-forest)] border-[var(--accent-forest)]/30 font-semibold",
    success: darkMode ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: darkMode ? "bg-amber-950/60 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-200",
    error: darkMode ? "bg-rose-950/60 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-200",
    info: darkMode ? "bg-sky-950/60 text-sky-300 border-sky-800" : "bg-sky-50 text-sky-800 border-sky-200",
    neutral: darkMode ? "bg-[var(--bg-card)] text-[var(--text-body)] border-[var(--border-main)]" : "bg-[var(--bg-surface)] text-[var(--text-body)] border-[var(--border-main)]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
