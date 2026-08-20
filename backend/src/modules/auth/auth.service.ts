import {
  IAuthService,
  IAuthUserResult,
  IRegisterData,
  IRefreshResult,
} from "../../interfaces/services/IAuthService";
import { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { ICryptoService } from "../../interfaces/infrastructure/ICryptoService";
import { ITokenService } from "../../interfaces/infrastructure/ITokenService";
import { IOtpService } from "../../interfaces/infrastructure/IOtpService";
import { AppError } from "../../utils/appError";
import { Role } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { TotpService } from "../../infrastructure/crypto/TotpService";
import { cacheService } from "../../services/cache.service";
import { tokenBlacklistService } from "../../services/tokenBlacklistService";
import { emailService } from "../email";
import * as crypto from "crypto";
import { RiskEngine } from "../../services/security/RiskEngine";
import { PreAuthChallengeService } from "../../services/security/PreAuthChallengeService";
import { SessionRevocationService } from "../../services/security/SessionRevocationService";
import { TokenVersionService } from "../../services/security/TokenVersionService";
import { EncryptionService } from "../../services/security/EncryptionService";

const CLOUDINARY_DEFAULT_AVATAR = "https://res.cloudinary.com/roombae/image/upload/v1700000000/default-avatar.png";
const CLOUDINARY_DEFAULT_OWNER_PHOTO = "https://res.cloudinary.com/roombae/image/upload/v1700000000/default-owner.png";

/**
 * AuthService - Production-grade authentication service.
 * Implements:
 *  - password hashing & verification
 *  - JWT access/refresh tokens
 *  - refresh token rotation & revocation
 *  - role-based authorization helpers
 *  - email & phone verification
 *  - Google OAuth
 *  - 2FA TOTP
 */
export class AuthService implements IAuthService {
  private get db(): any {
    return (global as any).prismaSingleton || prisma;
  }

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cryptoService: ICryptoService,
    private readonly tokenService: ITokenService,
    private readonly otpService: IOtpService,
  ) {}

  /**
   * Hash a refresh token so we never store raw refresh tokens in the database.
   */
  private hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generate an access token from a User record.
   */
  private buildAccessPayload(user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      residentCode: user.residentCode || undefined,
      sessionId: crypto.randomBytes(16).toString("hex"),
      tokenVersion: user.tokenVersion || 0,
    };
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    rememberMeOrIp?: boolean | string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const rememberMe = typeof rememberMeOrIp === "boolean" ? rememberMeOrIp : false;
    const actualIp = typeof rememberMeOrIp === "string" ? rememberMeOrIp : ipAddress;
    const actualUserAgent = typeof rememberMeOrIp === "string" ? ipAddress : userAgent;

    const expiresAt = new Date();
    const days = rememberMe ? 30 : 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    const tokenHash = this.hashRefreshToken(refreshToken);
    const ttlSeconds = days * 24 * 60 * 60;

    // Persist in DB (if model exists in Prisma client)
    try {
      if (this.db?.refreshToken) {
        await this.db.refreshToken.create({
          data: {
            userId,
            tokenHash,
            expiresAt,
            ipAddress: actualIp,
            userAgent: actualUserAgent,
          },
        });
      }
    } catch (dbErr: any) {
      logger.debug("RefreshToken DB write skipped:", { userId, error: dbErr?.message });
    }

    // Cache active session token in fast in-memory store
    try {
      await cacheService.set(`refresh_token:${tokenHash}`, { userId, expiresAt: expiresAt.toISOString() }, ttlSeconds);
    } catch (cacheErr: any) {
      logger.debug("RefreshToken cache storage skipped:", { userId, error: cacheErr?.message });
    }
  }

  /**
   * Rotate a refresh token - revoke old token and generate a new pair.
   * Detects reuse of a revoked token.
   */
  async refreshToken(token: string, ipAddress?: string, userAgent?: string): Promise<IRefreshResult> {
    if (!token) throw new AppError("Refresh token required", 401, "TOKEN_REQUIRED", "login");

    // Verify JWT signature
    let decoded: any;
    try {
      decoded = this.tokenService.verifyRefreshToken(token);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("Refresh token has expired. Please log in again.", 401, "REFRESH_TOKEN_EXPIRED", "login");
      }
      throw new AppError("Invalid refresh token signature.", 401, "INVALID_REFRESH_TOKEN", "login");
    }

    // Check stored token record
    const tokenHash = this.hashRefreshToken(token);
    let storedToken: any = null;
    try {
      if (this.db?.refreshToken) {
        storedToken = await this.db.refreshToken.findUnique({
          where: { tokenHash },
        });
      }
    } catch {}

    if (!storedToken) {
      // No valid session found in DB or cache — reject immediately.
      // Do NOT fabricate a storedToken from decoded JWT alone; that bypasses session validation.
      if (decoded?.id) {
        try {
          if (this.db?.refreshToken) {
            await this.db.refreshToken.updateMany({
              where: { userId: decoded.id, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }
        } catch {}
      }
      await cacheService.del(`refresh_token:${tokenHash}`);
      throw new AppError("Invalid refresh token. Please log in again.", 401, "INVALID_REFRESH_TOKEN", "login");
    }

    if (!storedToken) {
      if (decoded?.id) {
        try {
          if (this.db?.refreshToken) {
            await this.db.refreshToken.updateMany({
              where: { userId: decoded.id, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }
        } catch {}
      }
      await cacheService.del(`refresh_token:${tokenHash}`);
      throw new AppError("Invalid refresh token. Please log in again.", 401, "INVALID_REFRESH_TOKEN", "login");
    }

    if (storedToken.revokedAt) {
      logger.warn("Refresh token reuse detected, revoking all tokens", { userId: storedToken.userId });
      await SessionRevocationService.revokeAllSessions(
        storedToken.userId,
        "REFRESH_TOKEN_REUSE_DETECTED",
        ipAddress,
        userAgent
      );
      await cacheService.del(`refresh_token:${tokenHash}`);
      throw new AppError("Refresh token has been revoked. Please log in again.", 401, "REFRESH_TOKEN_REVOKED", "login");
    }

    if (storedToken.expiresAt < new Date()) {
      await cacheService.del(`refresh_token:${tokenHash}`);
      throw new AppError("Refresh token has expired. Please log in again.", 401, "REFRESH_TOKEN_EXPIRED", "login");
    }

    // Load fresh user from DB to ensure they still exist and get updated role/tokenVersion
    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      throw new AppError("User account no longer exists.", 401, "ACCOUNT_NOT_FOUND", "login");
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("This account has been deactivated.", 403, "ACCOUNT_INACTIVE", "login");
    }

    // Revoke current token (rotation) in DB and clear cache
    try {
      if (this.db?.refreshToken && storedToken.id) {
        await this.db.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        });
      }
    } catch {}
    await cacheService.del(`refresh_token:${tokenHash}`);

    // Generate new tokens
    const payload = this.buildAccessPayload(user);
    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    // Persist new rotated token
    await this.persistRefreshToken(user.id, newRefreshToken, ipAddress, userAgent);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout - revoke the provided refresh token and blacklist access token.
   */
  async logout(token: string, accessTokenOrUserId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    if (!token && !accessTokenOrUserId) return;

    if (token) {
      await SessionRevocationService.revokeRefreshToken(token);
    }

    if (accessTokenOrUserId && accessTokenOrUserId.startsWith("ey")) {
      await SessionRevocationService.revokeAccessToken(accessTokenOrUserId);
    }
  }

  /**
   * Logout from all devices - increments tokenVersion and revokes all active sessions.
   */
  async logoutAll(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await SessionRevocationService.revokeAllSessions(userId, "USER_LOGOUT_ALL", ipAddress, userAgent);
  }

  async googleAuth(code: string, role?: Role, ipAddress?: string, userAgent?: string): Promise<IAuthUserResult> {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const redirectUri = env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret) {
      throw new AppError("Google OAuth is not configured on the server.", 500);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || "",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new AppError(`Failed to exchange Google code: ${errText}`, 400);
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new AppError("Google did not return an access token.", 400);
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!profileRes.ok) {
      throw new AppError("Failed to fetch Google user profile.", 400);
    }

    const profile: any = await profileRes.json();
    const googleSubId = profile.id;
    const email = profile.email;
    const name = profile.name;
    const avatarUrl = profile.picture;

    if (!googleSubId || !email) {
      throw new AppError("Google profile is missing required fields.", 400);
    }

    const user = await this.userRepository.findOrCreateGoogleUser({
      googleSubId,
      email,
      name,
      avatarUrl,
      role,
    });

    const payload = this.buildAccessPayload(user);
    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    await this.persistRefreshToken(user.id, newRefreshToken, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        residentCode: user.residentCode || undefined,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async generateOAuthTokens(user: any, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.buildAccessPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);
    await this.persistRefreshToken(user.id, refreshToken, ipAddress, userAgent);
    return { accessToken, refreshToken };
  }

  async login(
    identifier: string,
    password: string,
    rememberMe?: boolean | string,
    ipAddress?: string,
    userAgent?: string,
    visitorId?: string
  ): Promise<IAuthUserResult | any> {
    const rawId = (identifier || "").trim();
    const cleanPass = password || "";

    const isRememberMe = typeof rememberMe === "boolean" ? rememberMe : false;
    const actualIp = typeof rememberMe === "string" ? rememberMe : ipAddress;
    const actualUserAgent = typeof rememberMe === "string" ? ipAddress : userAgent;

    logger.info("Login request received", { identifierType: rawId.includes("@") ? "email" : "other" });

    const user = await this.userRepository.findByIdentifier(rawId);

    if (!user) {
      logger.warn("Login failed: user not found", { identifier: rawId });
      throw new AppError(
        "We couldn't find an account with these details. Would you like to sign up instead?",
        401,
        "ACCOUNT_NOT_FOUND_OR_INVALID"
      );
    }

    if (!user.passwordHash) {
      logger.warn("Login failed: OAuth account", { userId: user.id });
      throw new AppError(
        "This account uses Google OAuth or Single Sign-On. Please sign in with Google.",
        401,
        "OAUTH_ACCOUNT_REQUIRES_SSO"
      );
    }

    const isValid = await this.cryptoService.comparePassword(
      cleanPass,
      user.passwordHash,
    );

    if (!isValid) {
      logger.warn("Login failed: invalid password", { userId: user.id });
      throw new AppError(
        "We couldn't find an account with these details. Would you like to sign up instead?",
        401,
        "ACCOUNT_NOT_FOUND_OR_INVALID"
      );
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("This account has been deactivated.", 403, "ACCOUNT_INACTIVE");
    }

    // Evaluate Behavioral & Device Risk Signals
    const effectiveVisitorId = visitorId || "anonymous_device";
    const riskAssessment = await RiskEngine.evaluateLoginRisk(
      user.id,
      effectiveVisitorId,
      actualIp || "127.0.0.1",
      actualUserAgent || "unknown"
    );

    if (riskAssessment.decision === "BLOCK") {
      await SessionRevocationService.writeAuditLog({
        userId: user.id,
        eventType: "LOGIN_BLOCKED",
        severity: "CRITICAL",
        riskScore: riskAssessment.riskScore,
        riskLevel: "HIGH",
        ipAddress: actualIp,
        userAgent: actualUserAgent,
        metadata: {
          reason: "RISK_ENGINE_SCORE_EXCEEDED",
          riskScore: riskAssessment.riskScore,
          signals: riskAssessment.signals,
        },
      });
      throw new AppError(
        "Login blocked due to high-risk security signals. Please contact support.",
        403,
        "LOGIN_BLOCKED"
      );
    }

    const requiresStepUp =
      riskAssessment.decision === "STEP_UP" ||
      user.is2FAEnabled === true ||
      (user as any).twoFactorEnabled === true;

    if (requiresStepUp) {
      const preAuthToken = await PreAuthChallengeService.createChallenge(
        user.id,
        effectiveVisitorId
      );

      // Dispatch 2FA verification OTP if email or phone is present
      if (user.email) {
        await this.otpService.generateAndSendOtp(user.email).catch(() => {});
      }

      await SessionRevocationService.writeAuditLog({
        userId: user.id,
        eventType: "LOGIN_STEP_UP_CHALLENGED",
        severity: "WARNING",
        riskScore: riskAssessment.riskScore,
        riskLevel: "MEDIUM",
        ipAddress: actualIp,
        userAgent: actualUserAgent,
        metadata: {
          signals: riskAssessment.signals,
        },
      });

      return {
        requiresTwoFactor: true,
        preAuthToken,
        message: "Two-factor authentication code required",
      };
    }

    // Record verified device
    await RiskEngine.recordDeviceSuccess(
      user.id,
      effectiveVisitorId,
      actualIp || "127.0.0.1",
      actualUserAgent || "unknown",
      false
    );

    // Record login history (best-effort)
    try {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: actualIp || "unknown",
          userAgent: actualUserAgent || "unknown",
          status: "SUCCESS",
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (err: any) {
      logger.debug("LoginHistory record creation skipped", { userId: user.id, error: err.message });
    }

    // Ensure linked Owner or Resident profile record exists for active user
    try {
      await this.userRepository.ensureUserProfile(user);
    } catch (profileErr: any) {
      logger.debug("Profile auto-ensure during login note:", { userId: user.id, error: profileErr?.message });
    }

    const payload = this.buildAccessPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.persistRefreshToken(user.id, refreshToken, isRememberMe, actualIp, actualUserAgent);

    await SessionRevocationService.writeAuditLog({
      userId: user.id,
      eventType: "LOGIN_SUCCESS",
      severity: "INFO",
      riskScore: riskAssessment.riskScore,
      riskLevel: "LOW",
      ipAddress: actualIp,
      userAgent: actualUserAgent,
      metadata: {
        rememberMe: isRememberMe,
      },
    });

    logger.info("Login successful", { userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        residentCode: user.residentCode || undefined,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(data: IRegisterData, ipAddress?: string, userAgent?: string): Promise<IAuthUserResult> {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new AppError(
        "An account with this email address already exists. Would you like to log in instead?",
        409,
        "DUPLICATE_ACCOUNT"
      );
    }

    const forcedRole = (data.role && (data.role === Role.OWNER || data.role === Role.RESIDENT)) ? data.role : Role.RESIDENT;
    const passwordHash = await this.cryptoService.hashPassword(data.password);

    let newUser: any;
    try {
      newUser = await this.userRepository.create({
        name: data.name,
        email: cleanEmail,
        passwordHash,
        phone: data.phone,
        role: forcedRole,
        residentCode: data.residentCode,
      });
    } catch (err: any) {
      if (err.code === "P2002" || err.message?.includes("E11000")) {
        throw new AppError(
          "An account with this email or phone number already exists.",
          409,
          "DUPLICATE_ACCOUNT"
        );
      }
      throw err;
    }

    const payload = this.buildAccessPayload(newUser);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.persistRefreshToken(newUser.id, refreshToken, ipAddress, userAgent);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        emailVerified: newUser.emailVerified,
        phoneVerified: newUser.phoneVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async sendOtp(identifier: string): Promise<{ message: string; devOtp?: string }> {
    if (!identifier) {
      return { message: "If an account with that contact details exists, an OTP code has been sent." };
    }
    const isEmail = identifier.includes("@");
    const user = await this.userRepository.findByIdentifier(identifier);

    if (!user) {
      return { message: "If an account with that contact details exists, an OTP code has been sent." };
    }

    const res = isEmail
      ? await this.otpService.generateAndSendOtp(identifier)
      : await this.otpService.generateAndSendPhoneOtp(identifier);

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? (res as any)?.otp || (res as any)?.devOtp : undefined;

    return {
      message: res.message,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyOtp(identifier: string, otp: string): Promise<IAuthUserResult> {
    if (!identifier) {
      throw new AppError("Email or phone number is required for OTP verification.", 400);
    }
    const isEmail = identifier.includes("@");
    const user = await this.userRepository.findByIdentifier(identifier);

    if (!user) {
      throw new AppError("User not found with provided contact details", 404);
    }

    const isValid = isEmail
      ? await this.otpService.verifyEmailCode(identifier, otp)
      : await this.otpService.verifyPhoneOtp(identifier, otp);

    if (!isValid) {
      throw new AppError("Invalid OTP verification code.", 400);
    }

    const payload = this.buildAccessPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.persistRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async sendPhoneOtp(
    phone: string,
  ): Promise<{ success: boolean; message: string; timerSeconds: number; devOtp?: string }> {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new AppError(
        "Valid phone number with country code is required",
        400,
      );
    }

    const result = await this.otpService.generateAndSendPhoneOtp(cleanPhone);

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? result.otp || result.devOtp : undefined;

    return {
      success: true,
      message: result.message,
      timerSeconds: result.timerSeconds,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPhoneOtp(
    phone: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!phone || !otp) {
      throw new AppError("Phone and OTP are required", 400);
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      throw new AppError("Invalid OTP code", 400);
    }

    const isValid = await this.otpService.verifyPhoneOtp(phone, otp);

    if (!isValid) {
      throw new AppError("Invalid OTP code", 400);
    }

    await this.userRepository.updateOtpForPhone(phone, true);

    return { success: true, message: "Phone number verified successfully!" };
  }

  async sendEmailVerification(
    email: string,
    name?: string,
  ): Promise<{ success: boolean; message: string; cooldownSeconds?: number; devOtp?: string }> {
    if (!email) throw new AppError("Email address is required", 400);
    if (this.otpService) {
      const res = await this.otpService.generateAndSendEmailVerification(email);
      // DEV-ONLY: remove or verify gated before production deploy
      const devOtp = process.env.NODE_ENV !== "production" ? res.code || res.devOtp : undefined;
      return {
        success: true,
        message: res.message,
        ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
      };
    }
    const emailRes = await emailService.sendOtp(email, name);
    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? (emailRes as any)?.devOtp : undefined;
    return {
      success: emailRes.success,
      message: emailRes.message,
      cooldownSeconds: emailRes.cooldownSeconds,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!email || !code) {
      throw new AppError("Email and verification code are required", 400);
    }
    if (this.otpService) {
      const isValid = await this.otpService.verifyEmailCode(email, code);
      if (!isValid) {
        throw new AppError("Invalid verification code", 400);
      }
      await this.userRepository.markEmailVerified(email);
      return { success: true, message: "Email verified successfully" };
    }
    return emailService.verifyOtp(email, code);
  }

  async sendPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string; devOtp?: string }> {
    if (!email) throw new AppError("Email address is required", 400);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return {
        success: true,
        message: `If an account with that email exists, password reset instructions have been sent.`,
      };
    }

    const { code } = await this.otpService.generateAndSendPasswordReset(email);
    const resetLink = `${env.FRONTEND_URL}/auth?mode=reset&email=${encodeURIComponent(email)}&code=${code}`;

    await emailService.sendPasswordResetEmail(email, resetLink, user.name);

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;

    return {
      success: true,
      message: `Password reset instructions sent to ${email}`,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPasswordReset(
    email: string,
    otp: string,
    newPassword?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!email || !otp) {
      throw new AppError("Email and reset OTP are required", 400);
    }

    const isValid = await this.otpService.verifyPasswordResetCode(email, otp);
    if (!isValid) {
      throw new AppError("Invalid or expired password reset code", 400);
    }

    if (newPassword) {
      const user = await this.userRepository.findByEmail(email);
      if (!user) throw new AppError("User not found", 404);
      const hashedPassword = await this.cryptoService.hashPassword(newPassword);
      await this.db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });
      // Invalidate all active sessions upon password reset
      await SessionRevocationService.revokeAllSessions(
        user.id,
        "PASSWORD_RESET",
        undefined,
        undefined
      );
    }

    return {
      success: true,
      message: "Password reset verified successfully.",
    };
  }

  async enableTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string; qrCodeImage: string; devOtp?: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const secret = TotpService.generateSecret();
    const qrCodeUrl = TotpService.generateQrCodeUrl(secret, user.email, "RoomBae");
    const qrCodeImage = await TotpService.generateQrCodeImage(secret, user.email, "RoomBae");

    await this.userRepository.updateTwoFactor(userId, secret, true, "TOTP");

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? TotpService.generateCurrentToken(secret) : undefined;

    return {
      secret,
      qrCodeUrl,
      qrCodeImage,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyTwoFactor(
    userIdOrPreAuthToken: string,
    token: string,
    rememberMe?: boolean,
    ipAddress?: string,
    userAgent?: string,
    visitorId?: string,
  ): Promise<any> {
    let userId = userIdOrPreAuthToken;
    let isPreAuth = false;

    // Check PreAuthChallengeService (MongoDB single-use verification)
    const challengeResult = await PreAuthChallengeService.verifyAndConsumeChallenge(
      userIdOrPreAuthToken,
      visitorId
    );

    if (challengeResult && challengeResult.userId) {
      userId = challengeResult.userId;
      isPreAuth = true;
    } else if (this.tokenService.verifyPreAuthToken) {
      try {
        const decoded = this.tokenService.verifyPreAuthToken(userIdOrPreAuthToken);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
          isPreAuth = true;
        }
      } catch (e) {
        // Not a pre-auth token, treat as userId directly
      }
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      throw new AppError("Invalid 6-digit Authenticator code", 400);
    }

    let isValid = false;
    if (user.twoFactorSecret) {
      isValid = TotpService.verifyToken(user.twoFactorSecret, token);
    }
    if (!isValid && user.email) {
      isValid = await this.otpService.verifyEmailCode(user.email, token).catch(() => false);
    }
    if (!isValid && user.phone) {
      isValid = await this.otpService.verifyPhoneOtp(user.phone, token).catch(() => false);
    }

    if (!isValid) {
      throw new AppError("Invalid two-factor authentication code", 401, "TWO_FACTOR_INVALID");
    }

    if (isPreAuth) {
      if (visitorId) {
        await RiskEngine.recordDeviceSuccess(
          user.id,
          visitorId,
          ipAddress || "127.0.0.1",
          userAgent || "unknown",
          true // trust device after successful 2FA
        );
      }

      const payload = this.buildAccessPayload(user);
      const accessToken = this.tokenService.generateAccessToken(payload);
      const refreshToken = this.tokenService.generateRefreshToken(payload);

      await this.persistRefreshToken(user.id, refreshToken, rememberMe, ipAddress, userAgent);

      try {
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress: ipAddress || "unknown",
            userAgent: userAgent || "unknown",
            status: "SUCCESS",
          },
        });
      } catch {}

      await SessionRevocationService.writeAuditLog({
        userId: user.id,
        eventType: "LOGIN_SUCCESS_2FA",
        severity: "INFO",
        riskScore: 0,
        riskLevel: "LOW",
        ipAddress,
        userAgent,
      });

      return {
        success: true,
        message: "Two-factor authentication verified successfully!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          residentCode: user.residentCode || undefined,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
        accessToken,
        refreshToken,
      };
    }

    return {
      success: true,
      message: "Two-factor authentication verified and activated!",
    };
  }

  async disableTwoFactor(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.userRepository.updateTwoFactor(userId, null, false, "NONE");

    return { success: true, message: "Two-factor authentication disabled" };
  }

  async me(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    let profile: any = null;
    if (user.role === Role.OWNER) {
      profile = await prisma.owner.findFirst({
        where: { userId: user.id },
        include: { pgs: true, kyc: true, business: true, subscription: true },
      });
    } else if (user.role === Role.RESIDENT) {
      profile = await prisma.resident.findFirst({
        where: { userId: user.id },
        include: { bed: true, pg: true },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      residentCode: user.residentCode || undefined,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      accountStatus: user.accountStatus,
      profile: profile || null,
    };
  }

  async ownerProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    let owner = await prisma.owner.findFirst({
      where: { userId: user.id },
      include: { pgs: true },
    });

    if (!owner) {
      logger.info("Auto-creating owner profile", { userId: user.id });
      // Create owner profile with empty/placeholder values - user will complete KYC later
      try {
        owner = await prisma.owner.create({
          data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            photo: user.avatarUrl || CLOUDINARY_DEFAULT_OWNER_PHOTO,
            address: "",
            aadhaarNumber: "",
            panNumber: "",
            upiId: "",
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            emergencyContact: "",
          },
          include: { pgs: true },
        });
      } catch (err) {
        logger.warn("Could not auto-create owner record", { userId: user.id, error: err });
      }
    }

    return { user, owner: owner || null };
  }

  async residentProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    let resident = await prisma.resident.findFirst({
      where: { userId: user.id },
      include: { bed: true, pg: true },
    });

    if (!resident) {
      logger.info("Creating resident profile with user data", { userId: user.id });
      try {
        resident = await prisma.resident.create({
          data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            profilePicture: user.avatarUrl || CLOUDINARY_DEFAULT_AVATAR,
            status: "ACTIVE",
          },
          include: { bed: true, pg: true },
        });
      } catch (err) {
        logger.warn("Could not auto-create resident record", { userId: user.id, error: err });
      }
    }

    return { user, resident: resident || null };
  }
}