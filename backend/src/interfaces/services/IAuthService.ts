import { Role } from "@prisma/client";

export interface IAuthUserResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    residentCode?: string;
    avatarUrl?: string | null;
    phone?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
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

export interface IRefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface LoginOptions {
  rememberMe?: boolean | string;
  ipAddress?: string;
  userAgent?: string;
  visitorId?: string;
}

export interface IAuthService {
  login(
    identifier: string,
    password: string,
    optionsOrRememberMe?: LoginOptions | boolean | string,
    ipAddress?: string,
    userAgent?: string,
    visitorId?: string
  ): Promise<IAuthUserResult | any>;
  register(data: IRegisterData, ipAddress?: string, userAgent?: string): Promise<IAuthUserResult>;
  googleAuth(code: string, role?: Role, ipAddress?: string, userAgent?: string): Promise<IAuthUserResult>;
  generateOAuthTokens(user: any, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }>;
  sendOtp(email: string): Promise<{ message: string; devOtp?: string }>;
  verifyOtp(email: string, otp: string): Promise<IAuthUserResult>;
  sendPhoneOtp(
    phone: string,
  ): Promise<{ success: boolean; message: string; timerSeconds: number; devOtp?: string }>;
  verifyPhoneOtp(
    phone: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }>;
  sendEmailVerification(
    email: string,
    name?: string,
  ): Promise<{ success: boolean; message: string; cooldownSeconds?: number; devOtp?: string }>;
  verifyEmail(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }>;
  sendPasswordReset?(
    email: string,
  ): Promise<{ success: boolean; message: string; devOtp?: string }>;
  verifyPasswordReset?(
    email: string,
    otp: string,
    newPassword?: string,
  ): Promise<{ success: boolean; message: string }>;
  enableTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string; qrCodeImage: string; devOtp?: string }>;
  verifyTwoFactor(
    userIdOrPreAuthToken: string,
    token: string,
    rememberMe?: boolean,
    ipAddress?: string,
    userAgent?: string,
    visitorId?: string,
  ): Promise<{ success: boolean; message: string } | any>;
  disableTwoFactor(
    userId: string,
  ): Promise<{ success: boolean; message: string }>;
  refreshToken(token: string, ipAddress?: string, userAgent?: string): Promise<IRefreshResult>;
  logout(token: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  logoutAll?(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
  me(userId: string): Promise<any>;

  ownerProfile(userId: string): Promise<any>;
  residentProfile(userId: string): Promise<any>;
}
