export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  RESIDENT: "RESIDENT",
  VISITOR: "VISITOR",
} as const;

export type Role = keyof typeof ROLES;
