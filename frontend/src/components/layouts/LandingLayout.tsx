import React from "react";
import { useTheme } from "@theme/index";

export interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#121212] text-[#f7f7f7]" : "bg-[#ffffff] text-[#222222]"
      }`}
    >
      <main>{children}</main>
    </div>
  );
};

export default LandingLayout;
