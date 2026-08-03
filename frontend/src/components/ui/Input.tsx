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
          <label className={`text-xs font-semibold ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${
                darkMode
                  ? "bg-[#332D2B] border-[#4A443F] text-[#F7F3EE] placeholder-[#8C7E75] focus-visible:ring-[#C89A4B] focus-visible:border-transparent"
                  : "bg-white border-[#E6D7CA] text-[#3B2A24] placeholder-[#A08C82] focus-visible:ring-[#D9A87C] focus-visible:border-transparent"
              }
              ${error ? "border-red-500 focus-visible:ring-red-500" : ""}
              ${className}
            `}
            {...props}
          />
          {rightIcon && <div className="absolute right-3.5 flex items-center">{rightIcon}</div>}
        </div>
        {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
