import { AuthService } from '../services/authService';

jest.mock('../config/prisma', () => ({
  prisma: {
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    otpToken: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback({})),
  },
}));

describe('RoomBae Enterprise Authentication System Unit Tests', () => {
  let mockUserRepo: any;
  let mockCryptoService: any;
  let mockTokenService: any;
  let mockOtpService: any;
  let authService: AuthService;

  beforeEach(() => {
    mockUserRepo = {
      findByIdentifier: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateOtp: jest.fn(),
      updateOtpForPhone: jest.fn(),
      markEmailVerified: jest.fn(),
      updateTwoFactor: jest.fn(),
    };
    mockCryptoService = {
      hashPassword: jest.fn().mockResolvedValue('hashed_password_xyz'),
      comparePassword: jest.fn().mockResolvedValue(true)
    };
    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
      generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      generatePreAuthToken: jest.fn().mockReturnValue('mock_pre_auth_token'),
      verifyAccessToken: jest.fn().mockReturnValue({ id: '507f1f77bcf86cd799439011', email: 'test@roombae.com', role: 'OWNER' }),
      verifyRefreshToken: jest.fn().mockReturnValue({ id: '507f1f77bcf86cd799439011', email: 'test@roombae.com', role: 'OWNER' }),
      verifyPreAuthToken: jest.fn().mockReturnValue({ preAuth: true, userId: '507f1f77bcf86cd799439011', role: 'ADMIN' }),
    };
    mockOtpService = {
      generateAndSendOtp: jest.fn().mockResolvedValue({ otp: '123456', expiresAt: new Date(Date.now() + 300000), message: 'OTP sent' }),
      generateAndSendPhoneOtp: jest.fn().mockResolvedValue({ otp: '123456', expiresAt: new Date(Date.now() + 300000), message: 'OTP sent', timerSeconds: 300 }),
      verifyPhoneOtp: jest.fn().mockResolvedValue(true),
      generateAndSendEmailVerification: jest.fn().mockResolvedValue({ code: '123456', expiresAt: new Date(Date.now() + 300000), message: 'Verification code sent' }),
      verifyEmailCode: jest.fn().mockResolvedValue(true),
      generateSecureOtp: jest.fn().mockReturnValue('123456'),
    };

    authService = new AuthService(mockUserRepo, mockCryptoService, mockTokenService, mockOtpService);
  });

  test('Should authenticate valid user login and return tokens', async () => {
    mockUserRepo.findByIdentifier.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      name: 'Test Owner',
      email: 'owner1@roombae.com',
      passwordHash: '$2a$10$xyz',
      role: 'OWNER',
      accountStatus: 'ACTIVE',
      residentCode: null,
      avatarUrl: null
    });

    const result = await authService.login('owner1@roombae.com', 'Password123!');
    expect(result.user.email).toBe('owner1@roombae.com');
    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBe('mock_refresh_token');
  });

  test('Should authenticate valid resident login using residentCode', async () => {
    mockUserRepo.findByIdentifier.mockResolvedValue({
      id: '507f1f77bcf86cd799439012',
      name: 'Test Resident',
      email: 'resident1@roombae.com',
      passwordHash: '$2a$10$xyz',
      role: 'RESIDENT',
      accountStatus: 'ACTIVE',
      residentCode: 'RES1001',
      avatarUrl: null
    });

    const result = await authService.login('RES1001', 'Password123!');
    expect(result.user.residentCode).toBe('RES1001');
    expect(result.user.role).toBe('RESIDENT');
    expect(result.accessToken).toBe('mock_access_token');
  });

  test('Should reject login for non-existent account with ACCOUNT_NOT_FOUND_OR_INVALID', async () => {
    mockUserRepo.findByIdentifier.mockResolvedValue(null);
    await expect(authService.login('unknown@roombae.com', 'Password123!')).rejects.toThrow("We couldn't find an account");
  });

  test('Should reject login when password comparison fails', async () => {
    mockUserRepo.findByIdentifier.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      email: 'owner1@roombae.com',
      passwordHash: '$2a$10$xyz',
      role: 'OWNER',
      accountStatus: 'ACTIVE'
    });
    mockCryptoService.comparePassword.mockResolvedValue(false);

    await expect(authService.login('owner1@roombae.com', 'WrongPass123')).rejects.toThrow("We couldn't find an account");
  });

  test('Should reject password login for Google OAuth account', async () => {
    mockUserRepo.findByIdentifier.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      email: 'oauth@roombae.com',
      passwordHash: null,
      googleSubId: 'sub_123',
      role: 'OWNER',
      accountStatus: 'ACTIVE'
    });

    await expect(authService.login('oauth@roombae.com', 'Password123!')).rejects.toThrow('Google OAuth');
  });

  test('Should refresh access token using valid refresh token', async () => {
    mockUserRepo.findById.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      email: 'test@roombae.com',
      role: 'OWNER',
      accountStatus: 'ACTIVE'
    });
    (require('../config/prisma').prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce({
      tokenHash: 'hashed_valid_refresh_token_string',
      userId: '507f1f77bcf86cd799439011',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000)
    });
    const result = await authService.refreshToken('valid_refresh_token_string');
    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBe('mock_refresh_token');
  });

  test('Should generate Phone OTP and return 300s countdown timer', async () => {
    const result = await authService.sendPhoneOtp('+91 98765 43210');
    expect(result.success).toBe(true);
    expect(result.timerSeconds).toBe(300);
    expect(result.message).toBeDefined();
  });

  test('Should verify valid Phone OTP successfully', async () => {
    mockUserRepo.updateOtpForPhone.mockResolvedValue({ phoneVerified: true });
    const result = await authService.verifyPhoneOtp('+91 98765 43210', '123456');
    expect(result.success).toBe(true);
    expect(result.message).toContain('verified successfully');
  });

  test('Should reject invalid Phone OTP', async () => {
    mockOtpService.verifyPhoneOtp.mockResolvedValue(false);
    await expect(authService.verifyPhoneOtp('+91 98765 43210', '999999')).rejects.toThrow('Invalid OTP code');
  });

  test('Should reject Phone OTP with wrong length', async () => {
    await expect(authService.verifyPhoneOtp('+91 98765 43210', '123')).rejects.toThrow('Invalid OTP code');
  });

  test('Should enable 2FA and generate TOTP QR Code URL', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@roombae.com',
    });
    const result = await authService.enableTwoFactor('507f1f77bcf86cd799439011');
    expect(result.secret).toBeDefined();
    expect(result.qrCodeUrl).toContain('otpauth://totp/');
    expect(result.qrCodeImage).toBeDefined();
  });

  test('Should register user with specified role and return tokens', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({
      id: '507f1f77bcf86cd799439013',
      name: 'Rajesh Kumar',
      email: 'rajesh@roombae.com',
      role: 'OWNER',
      accountStatus: 'ACTIVE'
    });

    const result = await authService.register({
      name: 'Rajesh Kumar',
      email: 'rajesh@roombae.com',
      password: 'Password123!',
      role: 'OWNER' as any
    });

    expect(result.user.name).toBe('Rajesh Kumar');
    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBe('mock_refresh_token');
  });

  test('Should send and verify email OTP', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: '507f1f77bcf86cd799439011', email: 'test@roombae.com', accountStatus: 'ACTIVE' });
    mockOtpService.verifyEmailCode.mockResolvedValue(true);
    mockUserRepo.updateOtp.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });

    const sendResult = await authService.sendOtp('test@roombae.com');
    expect(sendResult.message).toBeDefined();

    const verifyResult = await authService.verifyOtp('test@roombae.com', '123456');
    expect(verifyResult.accessToken).toBe('mock_access_token');
  });

  test('Should send and verify email verification code', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: '507f1f77bcf86cd799439011', email: 'test@roombae.com', accountStatus: 'ACTIVE' });
    mockOtpService.verifyEmailCode.mockResolvedValue(true);
    mockUserRepo.markEmailVerified.mockResolvedValue({ id: '507f1f77bcf86cd799439011', emailVerified: true });

    const sendResult = await authService.sendEmailVerification('test@roombae.com');
    expect(sendResult.success).toBe(true);

    const verifyResult = await authService.verifyEmail('test@roombae.com', '123456');
    expect(verifyResult.success).toBe(true);
  });

  test('Should reject invalid email verification code', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: '507f1f77bcf86cd799439011', email: 'test@roombae.com', accountStatus: 'ACTIVE' });
    mockOtpService.verifyEmailCode.mockResolvedValue(false);

    await expect(authService.verifyEmail('test@roombae.com', '000000')).rejects.toThrow('Invalid verification code');
  });
});

