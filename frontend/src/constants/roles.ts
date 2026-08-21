export const ROLES = {
  GOD: "GOD",
  SUPER_ADMIN: "GOD",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  RESIDENT: "RESIDENT",
  VISITOR: "VISITOR",
  PUBLIC: "PUBLIC",
} as const;

export type Role = keyof typeof ROLES;
