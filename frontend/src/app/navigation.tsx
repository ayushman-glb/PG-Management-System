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
          ? "border-[#2e2e2e] bg-[#1e1e1e] text-[#f7f7f7] hover:bg-[#252525] hover:border-[#ff385c] focus-visible:ring-[#ff385c]"
          : "border-[#dddddd] bg-[#ffffff] text-[#222222] hover:bg-[#f7f7f7] hover:border-[#ff385c] focus-visible:ring-[#ff385c]"
      } ${className}`}
    >
      <ArrowLeft className="h-4 w-4 flex-shrink-0" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
