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
          <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-[#a1a1aa]" : "text-[#6a6a6a]"}`}>
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
              w-full rounded-lg border px-3.5 py-3.5 min-h-[50px] text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#222222] dark:focus:ring-[#f7f7f7]
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${
                darkMode
                  ? "bg-[#1e1e1e] border-[#2e2e2e] text-[#f7f7f7] placeholder-[#71717a]"
                  : "bg-white border-[#dddddd] text-[#222222] placeholder-[#929292]"
              }
              ${error ? "border-[#c13515] focus:ring-[#c13515]" : ""}
              ${className}
            `}
            {...props}
          />
          {rightIcon && <div className="absolute right-3.5 flex items-center">{rightIcon}</div>}
        </div>
        {error && <span className="text-xs text-[#c13515] font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
