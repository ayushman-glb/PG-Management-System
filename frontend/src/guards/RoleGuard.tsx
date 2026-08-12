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
  fallback = (
    <div className="p-8 text-center text-rose-500 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/30 m-4">
      Access Denied: Insufficient Role Permissions
    </div>
  ),
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading permissions...</div>;
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const rawRole = (user.role || "RESIDENT").toUpperCase();
  const normalizedUserRole = rawRole === "PG_OWNER" ? "OWNER" : rawRole;
  const normalizedAllowed = allowedRoles.map((r) => {
    const u = r.toUpperCase();
    return u === "PG_OWNER" ? "OWNER" : u;
  });

  const isAllowed = normalizedAllowed.includes(normalizedUserRole);

  if (!isAllowed) return <>{fallback}</>;

  return <>{children}</>;
};
