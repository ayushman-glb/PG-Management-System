export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "GOD" | "SUPER_ADMIN" | "ADMIN" | "OWNER" | "MANAGER" | "STAFF" | "RESIDENT" | "VISITOR" | "PUBLIC";
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
