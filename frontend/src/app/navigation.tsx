import React, { createContext, useContext } from "react";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@theme/index";

const NavigationContext = createContext<(() => void) | null>(null);

export function NavigationProvider({
  goBack,
  children,
}: {
  goBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <NavigationContext.Provider value={goBack}>
      {children}
    </NavigationContext.Provider>
  );
}

export function BackButton({ className = "" }: { className?: string }) {
  const goBack = useContext(NavigationContext);
  const { darkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={goBack ?? (() => window.history.back())}
      aria-label="Go back to previous page"
      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none ${
        darkMode
          ? "border-[#4A443F] bg-[#332D2B] text-[#F7F3EE] hover:bg-[#3D3632] hover:border-[#C89A4B] focus-visible:ring-[#C89A4B]"
          : "border-[#E6D7CA] bg-[#FFFDFB] text-[#3B2A24] hover:bg-[#F8EEE5] hover:border-[#D9A87C] focus-visible:ring-[#D9A87C]"
      } ${className}`}
    >
      <ArrowLeft className="h-4 w-4 flex-shrink-0" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
