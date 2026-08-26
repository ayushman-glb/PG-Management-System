import React from "react";
import { useTheme } from "@theme/index";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  ...props
}) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`
        rounded-2xl border p-5 transition-all duration-300
        ${
          darkMode
            ? "bg-[#252220] border-[#252525] text-[var(--text-main)]"
            : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)]"
        }
        ${hoverEffect ? (darkMode ? "hover:border-[var(--brand-primary)]/50 hover:shadow-lg" : "hover:border-[var(--brand-primary)] hover:shadow-md") : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
