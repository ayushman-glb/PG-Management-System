import { Building2, Home, Compass, LayoutDashboard, Mail } from "lucide-react";
import type { Page } from "@app/App";
import { useTheme, ThemeToggle } from "@theme/index";

interface NotFoundPageProps {
  navigate: (p: Page) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-[100dvh] flex flex-col justify-between font-sans transition-colors duration-300 ${
        darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          darkMode
            ? "bg-[#2B2725]/90 border-[#4A443F]"
            : "bg-[#FFFDFB]/80 border-[#E6D7CA]/70"
        } px-4 py-4 md:px-6 md:py-5`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("landing")}
            aria-label="Go to RoomBae home"
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
              style={{
                background: darkMode
                  ? "linear-gradient(135deg, #C89A4B, #D8B36A)"
                  : "linear-gradient(135deg, #D9A87C, #C58B63)",
              }}
            >
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <span
              className={`font-bold text-lg ${
                darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"
              }`}
            >
              RoomBae
            </span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main 404 Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border ${
              darkMode
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-amber-100 text-amber-800 border-amber-200"
            }`}
          >
            <span>Error 404</span>
            <span className="opacity-50">•</span>
            <span>Page Not Found</span>
          </div>

          <h1
            className={`text-4xl md:text-6xl font-black tracking-tight mb-4 ${
              darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"
            }`}
          >
            Looking for a room that doesn't exist?
          </h1>

          <p
            className={`text-base md:text-lg mb-8 leading-relaxed ${
              darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"
            }`}
          >
            The link you followed may be broken, or the page may have been relocated.
            Let's get you back on the right path.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
            <button
              onClick={() => navigate("landing")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <button
              onClick={() => navigate("pg-listing")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-all hover:scale-105 cursor-pointer ${
                darkMode
                  ? "bg-[#2B2725] border-[#4A443F] text-[#F7F3EE] hover:bg-[#332D2B]"
                  : "bg-white border-[#E6D7CA] text-[#3B2A24] hover:bg-[#FFF8F2]"
              }`}
            >
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Explore PGs</span>
            </button>

            <button
              onClick={() => navigate("dashboard")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-all hover:scale-105 cursor-pointer ${
                darkMode
                  ? "bg-[#2B2725] border-[#4A443F] text-[#F7F3EE] hover:bg-[#332D2B]"
                  : "bg-white border-[#E6D7CA] text-[#3B2A24] hover:bg-[#FFF8F2]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-500" />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
            <span>Need assistance?</span>
            <a
              href="mailto:support@roombae.com"
              className="text-amber-500 hover:underline font-semibold flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@roombae.com</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        © {new Date().getFullYear()} RoomBae. All rights reserved.
      </footer>
    </div>
  );
};

export default NotFoundPage;
