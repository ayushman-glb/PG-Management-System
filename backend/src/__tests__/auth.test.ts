import { AuthService } from '../services/authService';


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
      updateOtp: jest.fn()
    };
    mockCryptoService = {
      hashPassword: jest.fn().mockResolvedValue('hashed_password_xyz'),
      comparePassword: jest.fn().mockResolvedValue(true)
    };
    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
      generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      verifyRefreshToken: jest.fn().mockReturnValue({ id: 'user-123', email: 'test@roombae.com', role: 'OWNER' })
    };
    mockOtpService = {
      generateAndSendOtp: jest.fn().mockResolvedValue({ otp: '123456', expiresAt: new Date(Date.now() + 300000), message: 'OTP sent' })
    };

    authService = new AuthService(mockUserRepo, mockCryptoService, mockTokenService, mockOtpService);
  });

  test('Should generate 6-digit Phone OTP with 60s countdown timer', async () => {
    const result = await authService.sendPhoneOtp('+91 98765 43210');
    expect(result.success).toBe(true);
    expect(result.timerSeconds).toBe(60);
    expect(result.message).toContain('+91 98765 43210');
  });

  test('Should verify valid Phone OTP successfully', async () => {
    const result = await authService.verifyPhoneOtp('+91 98765 43210', '123456');
    expect(result.success).toBe(true);
    expect(result.message).toContain('verified successfully');
  });

  test('Should reject invalid Phone OTP', async () => {
    await expect(authService.verifyPhoneOtp('+91 98765 43210', '999')).rejects.toThrow();
  });

  test('Should enable 2FA and generate TOTP QR Code URL', async () => {
    const result = await authService.enableTwoFactor('user-123');
    expect(result.secret).toContain('ROOMBAE_TOTP_SECRET');
    expect(result.qrCodeUrl).toContain('https://api.qrserver.com');
  });

  test('Should register user with specified role and return tokens', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({
      id: 'new-user-1',
      name: 'Rajesh Kumar',
      email: 'rajesh@roombae.com',
      role: 'OWNER'
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
});
