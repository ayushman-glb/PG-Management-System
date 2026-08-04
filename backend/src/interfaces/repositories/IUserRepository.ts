import { User, Role } from "@prisma/client";

export interface ICreateUserData {
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  role?: Role;
  residentCode?: string;
}

export interface IUserRepository {
  findByIdentifier(identifier: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByGoogleSubId(googleSubId: string): Promise<User | null>;
  findOrCreateGoogleUser(data: {
    googleSubId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role?: Role;
  }): Promise<User>;
  create(data: ICreateUserData): Promise<User>;
  updateOtp(
    id: string,
    otpSecret: string | null,
    otpExpiresAt: Date | null,
  ): Promise<User>;
}
