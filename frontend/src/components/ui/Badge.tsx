import React from "react";
import { useTheme } from "@theme/index";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
}) => {
  const { darkMode } = useTheme();

  const variantStyles = {
    success: darkMode ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: darkMode ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-amber-100 text-amber-800 border-amber-200",
    error: darkMode ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-red-100 text-red-800 border-red-200",
    info: darkMode ? "bg-sky-500/20 text-sky-300 border-sky-500/30" : "bg-sky-100 text-sky-800 border-sky-200",
    neutral: darkMode ? "bg-[#332D2B] text-[#C6B9AE] border-[#4A443F]" : "bg-[#F8EEE5] text-[#6E5A52] border-[#E6D7CA]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
