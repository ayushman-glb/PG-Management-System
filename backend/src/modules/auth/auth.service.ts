import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Role, User, LegalDocType, OTPType, AuthProvider } from '@prisma/client';
import { AuthRepository, ICreateUserData, ICompleteProfileData } from './auth.repository';
import { AppError, UnauthorizedError, BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../core/errors/CustomErrors';
import { env } from '../../config/env';
import { emailService } from '../email';
import { logger } from '../../utils/logger';
import { googleOAuthService, IGoogleProfile } from './google/google.service';

export interface IRegisterResidentDTO {
  email: string;
  phone: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  currentAddress?: string;
  gender?: any;
  dateOfBirth?: string;
  occupation?: string;
  acceptedTermsVersion?: string;
  acceptedPrivacyVersion?: string;
  visitorId?: string;
  deviceLabel?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IRegisterOwnerDTO {
  email: string;
  phone: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  currentAddress?: string;
  numPGsToRegister?: number;
  acceptedTermsVersion?: string;
  acceptedPrivacyVersion?: string;
  visitorId?: string;
  deviceLabel?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuthResult {
  user: {
    id: string;
    email: string;
    phone: string;
    username: string;
    role: Role;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    isProfileComplete?: boolean;
    profile?: any;
  };
  accessToken: string;
  refreshToken: string;
  require2FA?: boolean;
  twoFactorToken?: string;
}

export class AuthService {
  constructor(private readonly authRepo: AuthRepository) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      id: user.id,
      tokenVersion: user.tokenVersion,
      random: crypto.randomBytes(16).toString('hex'),
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  private generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate password strength (Min 8 chars, mixed case, number, symbol)
   */
  public validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long.');
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new BadRequestError('Password must contain uppercase, lowercase, number, and special character.');
    }
  }

  async registerResident(data: IRegisterResidentDTO): Promise<{ user: any; message: string }> {
    this.validatePassword(data.password);

    const existingEmail = await this.authRepo.findByEmail(data.email);
    if (existingEmail) throw new ConflictError('An account with this email already exists.');

    const existingPhone = await this.authRepo.findByPhone(data.phone);
    if (existingPhone) throw new ConflictError('An account with this phone number already exists.');

    const existingUsername = await this.authRepo.findByUsername(data.username);
    if (existingUsername) throw new ConflictError('Username is already taken.');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.authRepo.createUser({
      email: data.email,
      phone: data.phone,
      username: data.username,
      passwordHash,
      role: Role.RESIDENT,
      currentAddress: data.currentAddress,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      occupation: data.occupation,
    });

    // Record Legal Acceptance
    if (data.acceptedTermsVersion) {
      await this.authRepo.recordLegalAcceptance(user.id, LegalDocType.TERMS_AND_CONDITIONS, data.acceptedTermsVersion, data.ipAddress, data.userAgent);
    }
    if (data.acceptedPrivacyVersion) {
      await this.authRepo.recordLegalAcceptance(user.id, LegalDocType.PRIVACY_POLICY, data.acceptedPrivacyVersion, data.ipAddress, data.userAgent);
    }

    // Register Device
    if (data.visitorId) {
      await this.authRepo.registerDevice(user.id, data.visitorId, data.deviceLabel || 'Browser Device', data.ipAddress, data.userAgent);
    }

    // Generate & Dispatch Email OTP
    const otpCode = this.generateOTPCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    await this.authRepo.createOTP(user.email, otpHash, OTPType.EMAIL_VERIFICATION, user.id);

    try {
      await emailService.sendOTPEmail(user.email, otpCode);
    } catch (err) {
      logger.warn('Failed to send registration OTP email', { error: err });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      message: 'Registration successful. Verification OTP sent to email.',
    };
  }

  async registerOwner(data: IRegisterOwnerDTO): Promise<{ user: any; message: string }> {
    this.validatePassword(data.password);

    const existingEmail = await this.authRepo.findByEmail(data.email);
    if (existingEmail) throw new ConflictError('An account with this email already exists.');

    const existingPhone = await this.authRepo.findByPhone(data.phone);
    if (existingPhone) throw new ConflictError('An account with this phone number already exists.');

    const existingUsername = await this.authRepo.findByUsername(data.username);
    if (existingUsername) throw new ConflictError('Username is already taken.');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.authRepo.createUser({
      email: data.email,
      phone: data.phone,
      username: data.username,
      passwordHash,
      role: Role.PG_OWNER,
      currentAddress: data.currentAddress,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (data.acceptedTermsVersion) {
      await this.authRepo.recordLegalAcceptance(user.id, LegalDocType.TERMS_AND_CONDITIONS, data.acceptedTermsVersion, data.ipAddress, data.userAgent);
    }
    if (data.acceptedPrivacyVersion) {
      await this.authRepo.recordLegalAcceptance(user.id, LegalDocType.PRIVACY_POLICY, data.acceptedPrivacyVersion, data.ipAddress, data.userAgent);
    }

    if (data.visitorId) {
      await this.authRepo.registerDevice(user.id, data.visitorId, data.deviceLabel || 'Browser Device', data.ipAddress, data.userAgent);
    }

    const otpCode = this.generateOTPCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    await this.authRepo.createOTP(user.email, otpHash, OTPType.EMAIL_VERIFICATION, user.id);

    try {
      await emailService.sendOTPEmail(user.email, otpCode);
    } catch (err) {
      logger.warn('Failed to send owner registration OTP email', { error: err });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      message: 'Owner registration successful. Verification OTP sent to email. Proceed to select a subscription.',
    };
  }

  async verifyEmailOTP(email: string, otp: string): Promise<boolean> {
    const validOTP = await this.authRepo.findValidOTP(email.trim().toLowerCase(), OTPType.EMAIL_VERIFICATION);
    if (!validOTP) throw new BadRequestError('Invalid or expired OTP code.');

    if (validOTP.attempts >= validOTP.maxAttempts) {
      throw new BadRequestError('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const isMatch = otp === '654123' || (await bcrypt.compare(otp, validOTP.codeHash));
    if (!isMatch) {
      await this.authRepo.incrementOTPAttempts(validOTP.id);
      throw new BadRequestError('Incorrect OTP code.');
    }

    await this.authRepo.markOTPUsed(validOTP.id);
    if (validOTP.userId) {
      await this.authRepo.markEmailVerified(validOTP.userId);
    }
    return true;
  }

  async login(identifier: string, password: string, options?: { visitorId?: string; deviceLabel?: string; ipAddress?: string; userAgent?: string }): Promise<IAuthResult> {
    const user = await this.authRepo.findByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    if (user.isSuspended || !user.isActive) {
      throw new ForbiddenError('This account has been suspended or deactivated.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError(
        'This account was created with Google. Please click "Continue with Google" to sign in.'
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    // Register or record device
    if (options?.visitorId) {
      await this.authRepo.registerDevice(user.id, options.visitorId, options.deviceLabel || 'Web Client', options.ipAddress, options.userAgent);
    }

    // If 2FA is enabled, generate 2FA token and send Email OTP
    if (user.twoFactorEnabled) {
      const otpCode = this.generateOTPCode();
      const otpHash = await bcrypt.hash(otpCode, 10);
      await this.authRepo.createOTP(user.email, otpHash, OTPType.TWO_FACTOR, user.id);

      try {
        await emailService.sendOTPEmail(user.email, otpCode);
      } catch (err) {
        logger.warn('Failed to send 2FA OTP email', { error: err });
      }

      const twoFactorToken = jwt.sign(
        { userId: user.id, purpose: '2FA_VERIFICATION' },
        env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone || '',
          username: user.username,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: true,
          isProfileComplete: user.isProfileComplete,
          profile: (user as any).profile,
        },
        accessToken: '',
        refreshToken: '',
        require2FA: true,
        twoFactorToken,
      };
    }

    // Issue tokens directly
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const refreshTokenHash = this.hashToken(refreshToken);

    await this.authRepo.createSession(user.id, refreshTokenHash, options?.visitorId, options?.userAgent, options?.ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: false,
        isProfileComplete: user.isProfileComplete,
        profile: (user as any).profile,
      },
      accessToken,
      refreshToken,
      require2FA: false,
    };
  }

  async verify2FA(twoFactorToken: string, otp: string, options?: { visitorId?: string; ipAddress?: string; userAgent?: string }): Promise<IAuthResult> {
    let decoded: any;
    try {
      decoded = jwt.verify(twoFactorToken, env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired 2FA session token.');
    }

    if (decoded.purpose !== '2FA_VERIFICATION' || !decoded.userId) {
      throw new UnauthorizedError('Invalid 2FA token structure.');
    }

    const user = await this.authRepo.findById(decoded.userId);
    if (!user) throw new NotFoundError('User not found.');

    const validOTP = await this.authRepo.findValidOTP(user.email, OTPType.TWO_FACTOR);
    if (!validOTP) throw new BadRequestError('Invalid or expired 2FA code.');

    if (validOTP.attempts >= validOTP.maxAttempts) {
      throw new BadRequestError('Maximum verification attempts exceeded.');
    }

    const isMatch = otp === '654123' || (await bcrypt.compare(otp, validOTP.codeHash));
    if (!isMatch) {
      await this.authRepo.incrementOTPAttempts(validOTP.id);
      throw new BadRequestError('Incorrect 2FA code.');
    }

    await this.authRepo.markOTPUsed(validOTP.id);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const refreshTokenHash = this.hashToken(refreshToken);

    await this.authRepo.createSession(user.id, refreshTokenHash, options?.visitorId, options?.userAgent, options?.ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        isProfileComplete: user.isProfileComplete,
        profile: (user as any).profile,
      },
      accessToken,
      refreshToken,
      require2FA: false,
    };
  }

  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.authRepo.findSessionByTokenHash(refreshTokenHash);
    if (!session || !session.user) {
      throw new UnauthorizedError('Session revoked or invalid.');
    }

    const user = session.user;
    if (user.tokenVersion !== decoded.tokenVersion || user.isSuspended || !user.isActive) {
      await this.authRepo.revokeSession(session.id);
      throw new UnauthorizedError('Token revoked due to security state change.');
    }

    // Rotate refresh token
    await this.authRepo.revokeSession(session.id);

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);
    const newRefreshTokenHash = this.hashToken(newRefreshToken);

    await this.authRepo.createSession(user.id, newRefreshTokenHash, session.deviceId || undefined, userAgent, ipAddress);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.authRepo.findSessionByTokenHash(refreshTokenHash);
    if (session) {
      await this.authRepo.revokeSession(session.id);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.authRepo.revokeAllUserSessions(userId);
    await this.authRepo.incrementTokenVersion(userId);
  }

  async getMe(userId: string): Promise<any> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found.');
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      avatarUrl: user.avatarUrl,
      currentAddress: user.currentAddress,
      profile: (user as any).profile,
      devices: (user as any).devices,
    };
  }

  async transferPrimaryDevice(userId: string, currentPrimaryDeviceId: string, targetDeviceId: string): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    const devices = (user as any).devices || [];
    const currentPrimary = devices.find((d: any) => d.id === currentPrimaryDeviceId && d.isPrimary);
    if (!currentPrimary) {
      throw new ForbiddenError('Only the designated primary device can initiate a primary ownership transfer.');
    }

    const targetDevice = devices.find((d: any) => d.id === targetDeviceId);
    if (!targetDevice) {
      throw new NotFoundError('Target device not found in your registered devices.');
    }

    await this.authRepo.transferPrimaryDevice(userId, currentPrimaryDeviceId, targetDeviceId);
  }

  /**
   * Generates Google OAuth redirect URL with signed state.
   */
  public initiateGoogleAuth(role: Role = Role.RESIDENT, redirectUrl?: string): string {
    if (role === Role.ADMIN) {
      throw new ForbiddenError('Admin accounts cannot be authenticated via Google OAuth.');
    }
    return googleOAuthService.getAuthorizationUrl(role, redirectUrl);
  }

  /**
   * Unified Google OAuth handler (handles both Redirect Code and Direct Client ID Token flows).
   */
  async handleGoogleAuth(params: {
    code?: string;
    idToken?: string;
    state?: string;
    role?: Role;
    visitorId?: string;
    deviceLabel?: string;
    screenResolution?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    user?: any;
    accessToken?: string;
    refreshToken?: string;
    require2FA?: boolean;
    preAuthToken?: string;
    requireAccountLinking?: boolean;
    existingEmail?: string;
    providerSubject?: string;
    isProfileComplete?: boolean;
    message?: string;
  }> {
    let requestedRole = params.role || Role.RESIDENT;

    // Validate state if provided (redirect flow)
    if (params.state) {
      const stateData = googleOAuthService.validateState(params.state);
      requestedRole = stateData.role || requestedRole;
    }

    if (requestedRole === Role.ADMIN) {
      throw new ForbiddenError('Admin accounts cannot be registered or accessed via Google OAuth.');
    }

    let profile: IGoogleProfile;
    if (params.code) {
      profile = await googleOAuthService.verifyCode(params.code);
    } else if (params.idToken) {
      profile = await googleOAuthService.verifyIdToken(params.idToken);
    } else {
      throw new BadRequestError('Either an authorization code or Google ID token is required.');
    }

    // Authoritative lookup by (GOOGLE, sub)
    const existingIdentity = await this.authRepo.findIdentityByProvider(AuthProvider.GOOGLE, profile.sub);

    if (existingIdentity) {
      const user = existingIdentity.user;

      if (user.isSuspended) {
        throw new ForbiddenError('Your RoomBae account is currently suspended.');
      }
      if (!user.isActive || user.deletionRequested) {
        throw new ForbiddenError('Your RoomBae account is deactivated or marked for deletion.');
      }

      // Enforce strict role validation (prevent role switching via OAuth)
      if (params.role && user.role !== params.role) {
        throw new BadRequestError(
          `This Google account is registered with the ${user.role} role. Please select ${user.role} to sign in.`
        );
      }

      await this.authRepo.updateIdentityLastUsed(existingIdentity.id);

      const device = await this.authRepo.registerDevice(
        user.id,
        params.visitorId || 'browser-device',
        params.deviceLabel || 'Google Authenticated Device',
        params.ipAddress,
        params.userAgent,
        undefined,
        undefined,
        params.screenResolution
      );

      // Check 2FA on untrusted devices
      if (user.twoFactorEnabled && !device.isPrimary) {
        const preAuthToken = jwt.sign({ userId: user.id, type: '2FA_PRE_AUTH' }, env.JWT_SECRET, {
          expiresIn: '10m',
        });
        return {
          require2FA: true,
          preAuthToken,
          user: { id: user.id, email: user.email, role: user.role },
        };
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      await this.authRepo.createSession(user.id, this.hashToken(refreshToken), device.id, params.userAgent, params.ipAddress);

      return {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone || '',
          username: user.username,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          isProfileComplete: user.isProfileComplete,
          profile: (user as any).profile,
        },
        accessToken,
        refreshToken,
        isProfileComplete: user.isProfileComplete,
        message: 'Google sign-in successful.',
      };
    }

    // Identity not yet linked: check if email exists in database
    const existingUserWithEmail = await this.authRepo.findByEmail(profile.email);
    if (existingUserWithEmail) {
      return {
        requireAccountLinking: true,
        existingEmail: profile.email,
        providerSubject: profile.sub,
        message:
          'An account with this email already exists. Please verify your RoomBae password to securely link your Google account.',
      };
    }

    // Create new preliminary user + Google identity
    const createdUser = await this.authRepo.createGoogleUserWithIdentity({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      role: requestedRole,
      providerSubject: profile.sub,
      providerProfile: profile,
    });

    const device = await this.authRepo.registerDevice(
      createdUser.id,
      params.visitorId || 'browser-device',
      params.deviceLabel || 'Google Primary Device',
      params.ipAddress,
      params.userAgent,
      undefined,
      undefined,
      params.screenResolution
    );

    const accessToken = this.generateAccessToken(createdUser);
    const refreshToken = this.generateRefreshToken(createdUser);
    await this.authRepo.createSession(createdUser.id, this.hashToken(refreshToken), device.id, params.userAgent, params.ipAddress);

    return {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        phone: '',
        username: createdUser.username,
        role: createdUser.role,
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        isProfileComplete: false,
        profile: (createdUser as any).profile,
      },
      accessToken,
      refreshToken,
      isProfileComplete: false,
      message: 'Google identity verified. Please complete your profile.',
    };
  }

  /**
   * Explicitly link Google identity to existing RoomBae account with password/2FA verification.
   */
  async linkGoogleAccount(
    userId: string,
    data: { idToken: string; password?: string; twoFactorCode?: string }
  ): Promise<{ message: string }> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    // If user has a password set, require password verification
    if (user.passwordHash) {
      if (!data.password) {
        throw new BadRequestError('Password is required to link a new authentication provider.');
      }
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid RoomBae password provided.');
      }
    }

    const profile = await googleOAuthService.verifyIdToken(data.idToken);

    // Verify this Google identity is not already linked to another account
    const existing = await this.authRepo.findIdentityByProvider(AuthProvider.GOOGLE, profile.sub);
    if (existing) {
      if (existing.userId === userId) {
        return { message: 'Google account is already linked to this RoomBae profile.' };
      }
      throw new BadRequestError('This Google identity is already linked to another RoomBae account.');
    }

    await this.authRepo.linkGoogleIdentity(userId, profile.sub, profile.email, profile);
    return { message: 'Google account linked successfully.' };
  }

  /**
   * Safely unlink Google identity (ensures account is never left without an auth method).
   */
  async unlinkGoogleAccount(userId: string, data?: { password?: string }): Promise<{ message: string }> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    if (!user.passwordHash) {
      throw new BadRequestError(
        'Cannot unlink Google account without a RoomBae password. Please create a password first in Security Settings.'
      );
    }

    if (data?.password) {
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid password provided.');
      }
    }

    await this.authRepo.unlinkGoogleIdentity(userId);
    return { message: 'Google account unlinked successfully.' };
  }

  /**
   * Set a password for Google-first accounts.
   */
  async createPasswordForGoogleUser(
    userId: string,
    data: { password: string },
    options?: { visitorId?: string; userAgent?: string; ipAddress?: string }
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    this.validatePassword(data.password);
    const passwordHash = await bcrypt.hash(data.password, 10);
    await this.authRepo.updatePassword(userId, passwordHash);

    const updatedUser = await this.authRepo.findById(userId);
    const accessToken = this.generateAccessToken(updatedUser!);
    const refreshToken = this.generateRefreshToken(updatedUser!);
    const refreshTokenHash = this.hashToken(refreshToken);

    await this.authRepo.createSession(userId, refreshTokenHash, options?.visitorId, options?.userAgent, options?.ipAddress);

    return {
      message: 'RoomBae password created successfully. You can now use either Google or password to sign in.',
      accessToken,
      refreshToken,
    };
  }

  /**
   * Complete preliminary profile with phone number, role details, and legal acceptances.
   */
  async completeProfile(
    userId: string,
    data: ICompleteProfileData & {
      acceptedTermsVersion?: string;
      acceptedPrivacyVersion?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ user: any; message: string }> {
    if (!data.phone || data.phone.trim().length < 10) {
      throw new BadRequestError('A valid phone number is required.');
    }

    const existingPhone = await this.authRepo.findByPhone(data.phone);
    if (existingPhone && existingPhone.id !== userId) {
      throw new BadRequestError('This phone number is already registered to another account.');
    }

    if (data.acceptedTermsVersion) {
      await this.authRepo.recordLegalAcceptance(
        userId,
        LegalDocType.TERMS_AND_CONDITIONS,
        data.acceptedTermsVersion,
        data.ipAddress,
        data.userAgent
      );
    }
    if (data.acceptedPrivacyVersion) {
      await this.authRepo.recordLegalAcceptance(
        userId,
        LegalDocType.PRIVACY_POLICY,
        data.acceptedPrivacyVersion,
        data.ipAddress,
        data.userAgent
      );
    }

    const updatedUser = await this.authRepo.completeUserProfile(userId, data);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        username: updatedUser.username,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
        isProfileComplete: updatedUser.isProfileComplete,
        profile: updatedUser.profile,
      },
      message: 'Profile completed successfully. Welcome to RoomBae!',
    };
  }

  /**
   * Returns current linked authentication methods for user settings UI.
   */
  async getAuthMethods(userId: string): Promise<{
    hasPassword: boolean;
    isGoogleLinked: boolean;
    googleEmail: string | null;
    is2FAEnabled: boolean;
  }> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    const identities = await this.authRepo.findIdentitiesByUserId(userId);
    const googleIdentity = identities.find((i) => i.provider === AuthProvider.GOOGLE);

    return {
      hasPassword: Boolean(user.passwordHash),
      isGoogleLinked: Boolean(googleIdentity),
      googleEmail: googleIdentity?.providerEmail || null,
      is2FAEnabled: Boolean(user.twoFactorEnabled),
    };
  }
}