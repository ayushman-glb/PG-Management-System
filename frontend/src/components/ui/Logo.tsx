import React from "react";
import { Building2 } from "lucide-react";
import { useTheme } from "../../theme";

interface LogoProps {
  variant?: "full" | "compact" | "icon-only" | "auto";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = "auto",
  size = "md",
  onClick,
  className = "",
  badge,
}) => {
  const { darkMode } = useTheme();

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const svgSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-5.5 h-5.5",
  };

  const fontSizes = {
    sm: "text-base",
    md: "text-lg md:text-xl",
    lg: "text-xl md:text-2xl",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="RoomBae Home"
      className={`flex items-center gap-2.5 flex-shrink-0 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff385c] rounded-xl ${className}`}
    >
      <div
        className={`${iconSizes[size]} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm`}
        style={{
          background: "linear-gradient(135deg, #ff385c 0%, #e00b41 100%)",
        }}
      >
        <Building2 className={`${svgSizes[size]} text-white`} />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`font-black tracking-tight ${fontSizes[size]} ${
            variant === "icon-only"
              ? "hidden"
              : variant === "compact"
              ? "hidden sm:inline-block"
              : variant === "auto"
              ? "inline-block"
              : "inline-block"
          } ${darkMode ? "text-[#f7f7f7]" : "text-[#ff385c]"}`}
        >
          RoomBae
        </span>

        {badge && (
          <span
            className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
              darkMode
                ? "bg-[#252525] text-white border border-[#333333]"
                : "bg-[#f7f7f7] text-[#222222] border border-[#dddddd]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  );
};
