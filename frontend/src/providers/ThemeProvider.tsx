import { createContext, useContext, useEffect, useState } from "react";

export type AvatarPaletteMode = "luxury" | "gold" | "amber" | "bronze" | "rose" | "emerald" | "multi";

interface ThemeContextValue {
  darkMode: boolean;
  toggleDark: () => void;
  avatarTheme: AvatarPaletteMode;
  setAvatarTheme: (theme: AvatarPaletteMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("pg-manager-theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  const [avatarTheme, setAvatarThemeState] = useState<AvatarPaletteMode>(() => {
    const stored = localStorage.getItem("pg-manager-avatar-theme");
    if (stored && ["luxury", "gold", "amber", "bronze", "rose", "emerald", "multi"].includes(stored)) {
      return stored as AvatarPaletteMode;
    }
    return "luxury";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("pg-manager-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const setAvatarTheme = (theme: AvatarPaletteMode) => {
    setAvatarThemeState(theme);
    localStorage.setItem("pg-manager-avatar-theme", theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDark: () => setDarkMode((v) => !v),
        avatarTheme,
        setAvatarTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { darkMode, toggleDark } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      onClick={toggleDark}
      aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      className={`
        relative w-14 h-7 min-h-[28px] max-h-[28px] rounded-full transition-all duration-300 flex-shrink-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer
        ${darkMode
          ? "bg-gradient-to-r from-[#C89A4B] to-[#D8B36A] focus-visible:ring-[#C89A4B]"
          : "bg-gradient-to-r from-[#D9A87C] to-[#E7C4A0] focus-visible:ring-[#D9A87C]"
        }
        ${className}
      `}
      style={{
        boxShadow: darkMode ? "0 2px 10px rgba(200,154,75,0.4)" : "0 2px 10px rgba(217,168,124,0.35)",
        minHeight: "28px",
        maxHeight: "28px",
        height: "28px"
      }}

    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-6 h-6 rounded-full
          flex items-center justify-center text-xs select-none
          transition-all duration-300 ease-in-out shadow-md
          ${darkMode
            ? "translate-x-7 bg-[#1D1B1A] text-[#E8C98A]"
            : "translate-x-0 bg-white text-[#C58B63]"
          }
        `}
        aria-hidden="true"
      >
        {darkMode ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
