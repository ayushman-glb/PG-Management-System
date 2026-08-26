import React, { useState } from "react";
import { Building2, Home, Compass, LayoutDashboard, Mail, Check, Copy } from "lucide-react";
import type { Page } from "@app/App";
import { useTheme, ThemeToggle } from "@theme/index";

interface NotFoundPageProps {
  navigate: (p: Page) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  const { darkMode } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@roombae.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`min-h-[100dvh] flex flex-col justify-between font-sans transition-colors duration-300 ${
        darkMode ? "bg-[var(--bg-primary)] text-[var(--text-main)]" : "bg-[var(--bg-primary)] text-[var(--text-main)]"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          darkMode
            ? "bg-[var(--bg-nested)]/90 border-[var(--border-main)]"
            : "bg-[var(--bg-primary)]/80 border-[var(--border-main)]/70"
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
                background: "var(--brand-primary)",
              }}
            >
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <span
              className="font-bold text-lg text-[var(--text-main)]"
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/30"
          >
            <span>Error 404</span>
            <span className="opacity-50">•</span>
            <span>Page Not Found</span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-[var(--text-main)]"
          >
            Looking for a room that doesn't exist?
          </h1>

          <p
            className="text-base md:text-lg mb-8 leading-relaxed text-[var(--text-muted)]"
          >
            The link you followed may be broken, or the page may have been relocated.
            Let's get you back on the right path.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
            <button
              onClick={() => navigate("landing")}
              className="btn-primary flex items-center gap-2 px-5 py-3 text-sm shadow-lg shadow-[var(--brand-primary)]/20"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <button
              onClick={() => navigate("pg-listing")}
              className="btn-secondary flex items-center gap-2 px-5 py-3 text-sm"
            >
              <Compass className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Explore PGs</span>
            </button>

            <button
              onClick={() => navigate("dashboard")}
              className="btn-secondary flex items-center gap-2 px-5 py-3 text-sm"
            >
              <LayoutDashboard className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="pt-6 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] flex flex-wrap items-center justify-center gap-3">
            <span>Need assistance?</span>
            <a
              href="mailto:support@roombae.com"
              className="text-[var(--brand-primary)] hover:underline font-semibold flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@roombae.com</span>
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              title="Copy support email"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[var(--text-muted)] border-t border-[var(--border-main)]">
        © {new Date().getFullYear()} RoomBae Technologies, Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default NotFoundPage;
