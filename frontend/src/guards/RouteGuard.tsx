import React from "react";
import { useAuth } from "@hooks/useAuth";

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[var(--text-muted)]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h3 className="text-lg font-bold mb-2 text-[var(--text-main)]">Authentication Required</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Please sign in to access this portal.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
