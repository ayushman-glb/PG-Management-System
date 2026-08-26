import React from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "../../theme";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ruby" | "forest" | "secondary" | "outline" | "ghost" | "danger" | "pill-rausch";
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
      "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-xl active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3.5 py-2 min-h-[36px] gap-1.5",
      md: "text-sm px-5 py-2.5 min-h-[44px] gap-2",
      lg: "text-base px-6 py-3.5 min-h-[50px] gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white shadow-sm shadow-[rgba(0,77,97,0.25)] font-semibold hover:-translate-y-0.5",
      ruby:
        "bg-[var(--accent-ruby)] hover:bg-[var(--accent-ruby-hover)] text-white shadow-sm shadow-[rgba(130,38,89,0.25)] font-semibold hover:-translate-y-0.5",
      forest:
        "bg-[var(--accent-forest)] hover:bg-[var(--accent-forest-hover)] text-white shadow-sm shadow-[rgba(62,86,65,0.25)] font-semibold hover:-translate-y-0.5",
      secondary: darkMode
        ? "bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] font-semibold hover:-translate-y-0.5"
        : "bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] font-semibold hover:-translate-y-0.5",
      outline:
        "bg-transparent text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-surface)] hover:border-[var(--brand-primary)]",
      "pill-rausch":
        "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-full px-5 py-2 font-semibold shadow-sm",
      ghost:
        "bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-surface)]",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white font-semibold",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
          variant === "pill-rausch" ? "rounded-full" : ""
        } ${fullWidth ? "w-full" : ""} ${className}`}
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
