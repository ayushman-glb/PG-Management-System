import React from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "../../theme";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "pill-rausch";
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
      "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff385c] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3.5 py-2 min-h-[36px] gap-1.5",
      md: "text-sm px-5 py-2.5 min-h-[48px] gap-2",
      lg: "text-base px-6 py-3.5 min-h-[52px] gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-[#ff385c] hover:bg-[#e00b41] text-white shadow-sm shadow-rose-500/15 font-semibold",
      secondary: darkMode
        ? "bg-[#1e1e1e] text-[#f7f7f7] border border-[#2e2e2e] hover:bg-[#252525] font-semibold"
        : "bg-white text-[#222222] border border-[#222222] hover:bg-[#f7f7f7] font-semibold",
      outline: darkMode
        ? "bg-transparent text-[#f7f7f7] border border-[#4a4a4a] hover:bg-[#1a1a1a]"
        : "bg-transparent text-[#222222] border border-[#dddddd] hover:bg-[#f7f7f7]",
      "pill-rausch":
        "bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full px-5 py-2 font-semibold shadow-sm",
      ghost: darkMode
        ? "bg-transparent text-[#d4d4d8] hover:bg-[#1a1a1a] hover:text-white"
        : "bg-transparent text-[#222222] hover:bg-[#f7f7f7] hover:text-black",
      danger:
        "bg-[#c13515] hover:bg-[#b32505] text-white font-semibold",
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
