export interface IOtpService {
  generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string; devOtp?: string }>;
  generateAndSendPhoneOtp(phone: string): Promise<{ otp: string; expiresAt: Date; message: string; timerSeconds: number; devOtp?: string }>;
  verifyPhoneOtp(phone: string, otp: string): Promise<boolean>;
  generateAndSendEmailVerification(email: string): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;
  generateAndSendPasswordReset(email: string): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }>;
  verifyPasswordResetCode(email: string, code: string): Promise<boolean>;
  generateSecureOtp(length?: number): string;
}
