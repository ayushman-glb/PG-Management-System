export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export * from "./User";
export * from "./Resident";
export * from "./Property";
export * from "./Room";
export * from "./Bed";
export * from "./Complaint";
export * from "./Invoice";
export * from "./Owner";
export * from "./Notification";
export * from "./Visitor";
