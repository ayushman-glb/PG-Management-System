import { createContext, useContext } from "react";
import { ArrowLeft } from "lucide-react";

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

  return (
    <button
      type="button"
      onClick={goBack ?? (() => window.history.back())}
      aria-label="Go back"
      className={`flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
