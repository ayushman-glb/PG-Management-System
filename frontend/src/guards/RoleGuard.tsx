import React from "react";
import { useAuth } from "@hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-400">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl">
            🛑
          </div>
          <h3 className="text-lg font-bold mb-2 text-rose-500">Access Denied</h3>
          <p className="text-sm text-neutral-400 mb-6">You must be logged in to view this section.</p>
        </div>
      </div>
    );
  }

  const rawRole = (user.role || "RESIDENT").toUpperCase();
  const normalizedUserRole = rawRole === "PG_OWNER" ? "OWNER" : rawRole === "SUPER_ADMIN" ? "GOD" : rawRole;
  const normalizedAllowed = allowedRoles.map((r) => {
    const u = r.toUpperCase();
    return u === "PG_OWNER" ? "OWNER" : u === "SUPER_ADMIN" ? "GOD" : u;
  });

  const isAllowed = normalizedAllowed.includes(normalizedUserRole);

  if (!isAllowed) {
    return fallback ? <>{fallback}</> : (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h3 className="text-lg font-bold mb-2 text-rose-500">Restricted Access</h3>
          <p className="text-sm text-neutral-400 mb-2">
            Your account role (<span className="font-semibold text-amber-500">{user.role}</span>) does not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
