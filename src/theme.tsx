import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeContextValue {
  darkMode: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("pg-manager-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", darkMode);
    localStorage.setItem("pg-manager-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <ThemeContext.Provider
      value={{ darkMode, toggleDark: () => setDarkMode((value) => !value) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { darkMode, toggleDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDark}
      aria-label={darkMode ? "Use light theme" : "Use dark theme"}
      aria-pressed={darkMode}
      className={`rounded-xl p-2 transition-colors ${darkMode ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"} ${className}`}
    >
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
