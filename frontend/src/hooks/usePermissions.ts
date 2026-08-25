import { useMemo } from "react";
import { Permission, PERMISSIONS, Role, ROLES } from "@constants/index";

export function usePermissions(userRole?: Role) {
  const permissions = useMemo(() => {
    if (!userRole) return [];
    switch (userRole) {
      case ROLES.ADMIN:
      case ROLES.PG_OWNER:
        return Object.values(PERMISSIONS);
      case ROLES.RESIDENT:
        return [
          PERMISSIONS.VIEW_BILLING,
          PERMISSIONS.VIEW_COMPLAINTS,
        ];
      default:
        return [];
    }
  }, [userRole]);

  const hasPermission = (permission: Permission) => permissions.includes(permission);

  return { permissions, hasPermission };
}
