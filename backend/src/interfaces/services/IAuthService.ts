import { Role } from "@prisma/client";

export interface IAuthUserResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    residentCode?: string;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface IRegisterData {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  residentCode?: string;
  pgId?: string;
}

export interface IAuthService {
  login(identifier: string, password: string): Promise<IAuthUserResult>;
  register(data: IRegisterData): Promise<IAuthUserResult>;
  googleAuth(code: string, role?: Role): Promise<IAuthUserResult>;
  sendOtp(email: string): Promise<{ message: string }>;
  verifyOtp(email: string, otp: string): Promise<IAuthUserResult>;
  sendPhoneOtp(
    phone: string,
  ): Promise<{ success: boolean; message: string; timerSeconds: number }>;
  verifyPhoneOtp(
    phone: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }>;
  sendEmailVerification(
    email: string,
  ): Promise<{ success: boolean; message: string }>;
  verifyEmail(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }>;
  enableTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }>;
  verifyTwoFactor(
    userId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }>;
  disableTwoFactor(
    userId: string,
  ): Promise<{ success: boolean; message: string }>;
  refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }>;
  me(userId: string): Promise<any>;

  ownerProfile(userId: string): Promise<any>;
  residentProfile(userId: string): Promise<any>;
}
