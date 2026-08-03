export interface IOtpService {
  generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string }>;
}
