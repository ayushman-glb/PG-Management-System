import { useMemo } from "react";
import { Permission, PERMISSIONS, Role, ROLES } from "@constants/index";

export function usePermissions(userRole?: Role) {
  const permissions = useMemo(() => {
    if (!userRole) return [];
    switch (userRole) {
      case ROLES.GOD:
      case ROLES.SUPER_ADMIN:
      case ROLES.ADMIN:
      case ROLES.OWNER:
        return Object.values(PERMISSIONS);
      case ROLES.MANAGER:
        return [
          PERMISSIONS.VIEW_PROPERTIES,
          PERMISSIONS.VIEW_RESIDENTS,
          PERMISSIONS.MANAGE_RESIDENTS,
          PERMISSIONS.VIEW_BILLING,
          PERMISSIONS.VIEW_COMPLAINTS,
          PERMISSIONS.MANAGE_COMPLAINTS,
          PERMISSIONS.MANAGE_BEDS,
          PERMISSIONS.MANAGE_ROOMS,
        ];
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
