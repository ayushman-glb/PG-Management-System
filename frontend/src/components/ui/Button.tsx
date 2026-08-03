import React from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "../../theme";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const { darkMode } = useTheme();

    const baseStyles =
      "inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none rounded-2xl active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3.5 py-2 min-h-[38px] gap-1.5",
      md: "text-sm px-5 py-2.5 min-h-[44px] gap-2",
      lg: "text-base px-7 py-3.5 min-h-[50px] gap-2.5",
    };

    const variantStyles = {
      primary: darkMode
        ? "bg-gradient-to-r from-[#C89A4B] to-[#D8B36A] text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/10 focus-visible:ring-amber-400"
        : "bg-gradient-to-r from-[#D9A87C] to-[#C58B63] text-white hover:brightness-105 shadow-lg shadow-amber-900/15 focus-visible:ring-amber-500",
      secondary: darkMode
        ? "bg-[#332D2B] text-[#F7F3EE] border border-[#4A443F] hover:bg-[#3D3632] focus-visible:ring-neutral-400"
        : "bg-[#FFFDFB] text-[#3B2A24] border border-[#E6D7CA] hover:bg-[#F8EEE5] shadow-sm focus-visible:ring-amber-500",
      outline: darkMode
        ? "bg-transparent text-[#C89A4B] border-2 border-[#C89A4B]/40 hover:bg-[#C89A4B]/10 focus-visible:ring-amber-400"
        : "bg-transparent text-[#C58B63] border-2 border-[#C58B63]/40 hover:bg-[#C58B63]/10 focus-visible:ring-amber-500",
      ghost: darkMode
        ? "bg-transparent text-[#C6B9AE] hover:bg-[#332D2B] hover:text-[#F7F3EE]"
        : "bg-transparent text-[#6E5A52] hover:bg-[#F8EEE5] hover:text-[#3B2A24]",
      danger:
        "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:brightness-110 shadow-lg shadow-red-500/20 focus-visible:ring-red-500",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
