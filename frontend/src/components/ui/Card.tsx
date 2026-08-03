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
            ? "bg-[#252220] border-[#3D3632] text-[#F7F3EE]"
            : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"
        }
        ${hoverEffect ? (darkMode ? "hover:border-[#C89A4B]/50 hover:shadow-lg" : "hover:border-[#D9A87C] hover:shadow-md") : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
