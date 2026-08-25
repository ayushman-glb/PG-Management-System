export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "PG_OWNER" | "RESIDENT" | "ADMIN";
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
