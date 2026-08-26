import React from "react";
import { useTheme } from "@theme/index";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = "", ...props }, ref) => {
    const { darkMode } = useTheme();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"}`}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg border px-3.5 py-3.5 min-h-[50px] text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)] dark:focus:ring-[var(--text-main)]
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${
                darkMode
                  ? "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] placeholder-[#71717a]"
                  : "bg-white border-[var(--border-main)] text-[var(--text-main)] placeholder-[#929292]"
              }
              ${error ? "border-rose-600 focus:ring-rose-600" : ""}
              ${className}
            `}
            {...props}
          />
          {rightIcon && <div className="absolute right-3.5 flex items-center">{rightIcon}</div>}
        </div>
        {error && <span className="text-xs text-rose-600 font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
