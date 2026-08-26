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
            ? "bg-[#252220] border-[#252525] text-[#f7f7f7]"
            : "bg-[#ffffff] border-[#dddddd] text-[#222222]"
        }
        ${hoverEffect ? (darkMode ? "hover:border-[#ff385c]/50 hover:shadow-lg" : "hover:border-[#ff385c] hover:shadow-md") : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
