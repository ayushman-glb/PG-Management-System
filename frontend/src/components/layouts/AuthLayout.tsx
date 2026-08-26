import React from "react";
import { useTheme } from "@theme/index";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        darkMode ? "bg-[var(--bg-primary)] text-[var(--text-main)]" : "bg-[var(--bg-primary)] text-[var(--text-main)]"
      }`}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};

export default AuthLayout;
