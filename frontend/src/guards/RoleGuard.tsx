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
  fallback = <div className="p-8 text-center text-red-500 font-bold">Access Denied: Insufficient Role Permissions</div>,
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center animate-pulse">Loading...</div>;

  const hasRole = user && allowedRoles.includes(user.role);

  if (!hasRole) return <>{fallback}</>;

  return <>{children}</>;
};
