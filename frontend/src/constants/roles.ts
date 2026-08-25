export const ROLES = {
  PG_OWNER: "PG_OWNER",
  RESIDENT: "RESIDENT",
  ADMIN: "ADMIN",
} as const;

export type Role = keyof typeof ROLES;

