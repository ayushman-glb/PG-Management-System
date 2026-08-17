export interface SendPhoneOtpInput {
  phone: string;
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyPhoneOtpInput {
  phone: string;
  otp: string;
  purpose?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResendPhoneOtpInput {
  phone: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PhoneOtpRecord {
  id: string;
  phone: string;
  hashedOtp: string;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface PhoneAuthStatusResponse {
  phone: string;
  isPhoneVerified: boolean;
  phoneVerifiedAt?: Date | null;
  hasActiveOtp: boolean;
  cooldownSecondsRemaining: number;
  attemptsRemaining: number;
  resendsRemaining: number;
}

export interface PhoneOtpVerificationResult {
  success: boolean;
  message: string;
  phone: string;
  isPhoneVerified: boolean;
  phoneVerifiedAt?: Date;
  verificationToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    isPhoneVerified: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isTrialNotice?: boolean;
}
