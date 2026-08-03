export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "STAFF" | "RESIDENT" | "VISITOR";
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
