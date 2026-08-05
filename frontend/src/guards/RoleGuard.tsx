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
    <div className="p-8 text-center text-red-500 font-bold">
      Access Denied: Insufficient Role Permissions
    </div>
  ),
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading permissions...</div>;
  }

  // Normalize role strings (e.g., "owner" -> "OWNER", "PG_OWNER" -> "OWNER")
  const rawRole = (user?.role || "OWNER").toUpperCase();
  const normalizedUserRole = rawRole === "PG_OWNER" ? "OWNER" : rawRole;
  const normalizedAllowed = allowedRoles.map((r) => {
    const u = r.toUpperCase();
    return u === "PG_OWNER" ? "OWNER" : u;
  });

  // Check if role matches or if demo/unauthenticated owner view
  const isAllowed =
    !user || // Default to allowed for guest/demo dashboard view
    normalizedAllowed.includes(normalizedUserRole) ||
    (normalizedAllowed.includes("OWNER") &&
      ["OWNER", "PG_OWNER", "SUPER_ADMIN", "ADMIN", "MANAGER"].includes(normalizedUserRole)) ||
    (normalizedAllowed.includes("ADMIN") &&
      ["ADMIN", "SUPER_ADMIN", "OWNER", "PG_OWNER"].includes(normalizedUserRole));

  if (!isAllowed) return <>{fallback}</>;

  return <>{children}</>;
};
