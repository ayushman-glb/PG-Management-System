import { User } from '@prisma/client';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  residentCode?: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  accountStatus: string;
}

export class AuthMapper {
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      residentCode: user.residentCode,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      accountStatus: user.accountStatus,
    };
  }
}
