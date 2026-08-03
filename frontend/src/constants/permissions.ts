export const PERMISSIONS = {
  VIEW_PROPERTIES: "view:properties",
  MANAGE_PROPERTIES: "manage:properties",
  VIEW_RESIDENTS: "view:residents",
  MANAGE_RESIDENTS: "manage:residents",
  VIEW_BILLING: "view:billing",
  MANAGE_BILLING: "manage:billing",
  VIEW_COMPLAINTS: "view:complaints",
  MANAGE_COMPLAINTS: "manage:complaints",
  VIEW_ANALYTICS: "view:analytics",
  MANAGE_BEDS: "manage:beds",
  MANAGE_ROOMS: "manage:rooms",
  MANAGE_VISITORS: "manage:visitors",
  MANAGE_NOTIFICATIONS: "manage:notifications",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
