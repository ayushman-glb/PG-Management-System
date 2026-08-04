import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: Role;
      residentCode?: string | null;
      name?: string;
      avatarUrl?: string | null;
      googleSubId?: string | null;
    }
  }
}
