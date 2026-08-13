import { LoginSchema, RegisterSchema, SendPhoneOtpSchema, VerifyPhoneOtpSchema, Enable2FASchema } from '../../modules/auth/auth.dto';

describe('Auth DTO Schemas Unit Tests', () => {
  describe('LoginSchema', () => {
    test('validates valid login with email and password', () => {
      const result = LoginSchema.safeParse({
        body: { email: 'user@example.com', password: 'Password123!' },
      });
      expect(result.success).toBe(true);
    });

    test('validates valid login with identifier (email/phone)', () => {
      const result = LoginSchema.safeParse({
        body: { identifier: '+919876543210', password: 'Password123!' },
      });
      expect(result.success).toBe(true);
    });

    test('validates valid login with residentCode', () => {
      const result = LoginSchema.safeParse({
        body: { residentCode: 'RES1001', password: 'Password123!' },
      });
      expect(result.success).toBe(true);
    });

    test('fails when no identifier, email, or residentCode provided', () => {
      const result = LoginSchema.safeParse({
        body: { password: 'Password123!' },
      });
      expect(result.success).toBe(false);
    });

    test('fails when password is empty', () => {
      const result = LoginSchema.safeParse({
        body: { email: 'user@example.com', password: '' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    test('validates valid OWNER signup payload', () => {
      const result = RegisterSchema.safeParse({
        body: {
          name: 'Jane Owner',
          email: 'owner@roombae.com',
          password: 'SecurePassword123!',
          role: 'OWNER',
          phone: '+919876543210',
        },
      });
      expect(result.success).toBe(true);
    });

    test('validates valid RESIDENT signup payload', () => {
      const result = RegisterSchema.safeParse({
        body: {
          name: 'John Resident',
          email: 'resident@roombae.com',
          password: 'SecurePassword123!',
          role: 'RESIDENT',
        },
      });
      expect(result.success).toBe(true);
    });

    test('rejects client attempt to signup as ADMIN or SUPER_ADMIN', () => {
      const adminResult = RegisterSchema.safeParse({
        body: {
          name: 'Hacker Admin',
          email: 'hacker@example.com',
          password: 'SecurePassword123!',
          role: 'ADMIN',
        },
      });
      expect(adminResult.success).toBe(false);

      const superAdminResult = RegisterSchema.safeParse({
        body: {
          name: 'Hacker SuperAdmin',
          email: 'super@example.com',
          password: 'SecurePassword123!',
          role: 'SUPER_ADMIN',
        },
      });
      expect(superAdminResult.success).toBe(false);
    });

    test('fails when email is invalid format', () => {
      const result = RegisterSchema.safeParse({
        body: {
          name: 'User Name',
          email: 'invalid-email-format',
          password: 'Password123!',
        },
      });
      expect(result.success).toBe(false);
    });

    test('fails when password is too short (< 8 chars)', () => {
      const result = RegisterSchema.safeParse({
        body: {
          name: 'User Name',
          email: 'user@example.com',
          password: 'short',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SendPhoneOtpSchema & VerifyPhoneOtpSchema', () => {
    test('validates phone OTP send payload', () => {
      const result = SendPhoneOtpSchema.safeParse({
        body: { phone: '9876543210' },
      });
      expect(result.success).toBe(true);
    });

    test('validates phone OTP verify payload', () => {
      const result = VerifyPhoneOtpSchema.safeParse({
        body: { phone: '9876543210', otp: '123456' },
      });
      expect(result.success).toBe(true);
    });

    test('fails when OTP is not 6 digits', () => {
      const result = VerifyPhoneOtpSchema.safeParse({
        body: { phone: '9876543210', otp: '123' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Enable2FASchema', () => {
    test('validates enable 2FA payload', () => {
      const result = Enable2FASchema.safeParse({
        body: { userId: '507f1f77bcf86cd799439011' },
      });
      expect(result.success).toBe(true);
    });
  });
});
