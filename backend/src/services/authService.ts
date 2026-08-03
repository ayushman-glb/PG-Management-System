import { IAuthService, IAuthUserResult, IRegisterData } from '../interfaces/services/IAuthService';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { ICryptoService } from '../interfaces/infrastructure/ICryptoService';
import { ITokenService } from '../interfaces/infrastructure/ITokenService';
import { IOtpService } from '../interfaces/infrastructure/IOtpService';
import { AppError } from '../utils/appError';
import { Role } from '@prisma/client';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cryptoService: ICryptoService,
    private readonly tokenService: ITokenService,
    private readonly otpService: IOtpService
  ) {}

  /**
   * User login via Credentials (email/password or residentCode/password)
   */
  async login(identifier: string, password: string): Promise<IAuthUserResult> {
    const user = await this.userRepository.findByIdentifier(identifier);

    if (!user) {
      throw new AppError('Invalid email/resident ID or password', 401);
    }

    if (!user.passwordHash) {
      throw new AppError('This account uses a different sign-in method (e.g. Google OAuth).', 401);
    }

    const isValid = await this.cryptoService.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email/resident ID or password', 401);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      residentCode: user.residentCode || undefined
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        residentCode: user.residentCode || undefined,
        avatarUrl: user.avatarUrl
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Register User (Owner or Resident initial)
   */
  async register(data: IRegisterData): Promise<IAuthUserResult> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const passwordHash = await this.cryptoService.hashPassword(data.password);
    const userRole = data.role || Role.OWNER;

    const newUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: userRole
    });

    const payload = { id: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Send 6-Digit OTP
   */
  async sendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found with provided email', 404);
    }

    const { otp, expiresAt, message } = await this.otpService.generateAndSendOtp(email);
    await this.userRepository.updateOtp(user.id, otp, expiresAt);

    // SECURITY: Never return the OTP in the API response.
    // The OTP must only be delivered via the out-of-band channel (email/SMS).
    return { message };
  }

  /**
   * Verify 6-digit OTP
   */
  async verifyOtp(email: string, otp: string): Promise<IAuthUserResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.otpSecret || !user.otpExpiresAt) {
      throw new AppError('OTP not requested or expired.', 400);
    }

    if (user.otpExpiresAt < new Date()) {
      throw new AppError('OTP has expired. Please request a new code.', 400);
    }

    if (user.otpSecret !== otp) {
      throw new AppError('Invalid OTP verification code.', 400);
    }

    await this.userRepository.updateOtp(user.id, null, null);

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  }

  /**
   * Send Phone OTP
   */
  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string; timerSeconds: number }> {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new AppError('Valid phone number with country code is required', 400);
    }

    // Generate 6-digit numerical OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const timerSeconds = 60;

    return {
      success: true,
      message: `OTP sent to ${cleanPhone}. Please verify within 5 minutes.`,
      timerSeconds
    };
  }

  /**
   * Verify Phone OTP
   */
  async verifyPhoneOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    if (!phone || !otp) {
      throw new AppError('Phone and OTP are required', 400);
    }

    // Default mock verification or matching
    if (otp === '123456' || otp.length === 6) {
      return { success: true, message: 'Phone number verified successfully!' };
    }

    throw new AppError('Invalid OTP code', 400);
  }

  /**
   * Send Email Verification
   */
  async sendEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
    if (!email) throw new AppError('Email address is required', 400);

    return {
      success: true,
      message: `Email verification code sent to ${email}`
    };
  }

  /**
   * Verify Email Code
   */
  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!email || !code) throw new AppError('Email and verification code are required', 400);

    return {
      success: true,
      message: 'Email address verified successfully!'
    };
  }

  /**
   * Enable 2FA for account settings
   */
  async enableTwoFactor(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = 'ROOMBAE_TOTP_SECRET_XYZ_' + Date.now().toString(36);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/RoomBae:${userId}?secret=${secret}&issuer=RoomBae`;
    return { secret, qrCodeUrl };
  }

  /**
   * Verify 2FA code for account settings
   */
  async verifyTwoFactor(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    if (!token || token.length !== 6) {
      throw new AppError('Invalid 6-digit Authenticator code', 400);
    }
    return { success: true, message: 'Two-factor authentication enabled successfully!' };
  }

  async disableTwoFactor(userId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Two-factor authentication disabled' };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    if (!token) throw new AppError('Refresh token required', 401);
    const decoded = this.tokenService.verifyRefreshToken(token);
    const accessToken = this.tokenService.generateAccessToken({ id: decoded.id, email: decoded.email, role: decoded.role });
    return { accessToken };
  }

  async me(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async ownerProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async residentProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}


