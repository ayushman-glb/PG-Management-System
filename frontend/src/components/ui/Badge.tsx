import React from "react";
import { useTheme } from "@theme/index";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "guest-favorite" | "rausch";
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
      ? "bg-white text-[#222222] border-white font-bold shadow-sm"
      : "bg-white text-[#222222] border-[#dddddd] font-bold shadow-sm",
    rausch: "bg-[#ff385c] text-white border-[#ff385c] font-bold",
    success: darkMode ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: darkMode ? "bg-amber-950/60 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-200",
    error: darkMode ? "bg-rose-950/60 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-200",
    info: darkMode ? "bg-sky-950/60 text-sky-300 border-sky-800" : "bg-sky-50 text-sky-800 border-sky-200",
    neutral: darkMode ? "bg-[#1e1e1e] text-[#d4d4d8] border-[#2e2e2e]" : "bg-[#f7f7f7] text-[#3f3f3f] border-[#dddddd]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
