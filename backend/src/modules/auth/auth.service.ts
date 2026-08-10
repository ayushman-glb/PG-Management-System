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
import * as crypto from "crypto";

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

  /**
   * Persist a refresh token (hashed) associated with the user.
   */
  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const expiresAt = new Date();
    const expiresInMs = env.JWT_REFRESH_EXPIRATION || "7d";
    // Parse expires duration (e.g. "7d" -> 7 days)
    const match = expiresInMs.match(/^(\d+)([smhd])$/);
    if (match) {
      const [, num, unit] = match;
      const mult = unit === "s" ? 1000 : unit === "m" ? 60 * 1000 : unit === "h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      expiresAt.setTime(Date.now() + parseInt(num) * mult);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
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
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      // Possibly a token from before rotation tracking - revoke all user tokens if we can identify user
      if (decoded?.id) {
        await prisma.refreshToken.updateMany({
          where: { userId: decoded.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new AppError("Invalid refresh token. Please log in again.", 401, "INVALID_REFRESH_TOKEN", "login");
    }

    if (storedToken.revokedAt) {
      // Token reuse detected - revoke entire token family
      logger.warn("Refresh token reuse detected, revoking all tokens", { userId: storedToken.userId });
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError("Refresh token has been revoked. Please log in again.", 401, "REFRESH_TOKEN_REVOKED", "login");
    }

    if (storedToken.expiresAt < new Date()) {
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

    // Revoke current token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const payload = this.buildAccessPayload(user);
    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    // Persist new rotated token
    await this.persistRefreshToken(user.id, newRefreshToken, ipAddress, userAgent);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout - revoke the provided refresh token.
   */
  async logout(token: string): Promise<void> {
    if (!token) return;
    const tokenHash = this.hashRefreshToken(token);
    try {
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch (err) {
      logger.warn("Failed to revoke refresh token during logout", { error: err });
    }
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

  async login(identifier: string, password: string, ipAddress?: string, userAgent?: string): Promise<IAuthUserResult> {
    const rawId = (identifier || "").trim();
    const cleanPass = password || "";

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

    // Record login history (best-effort)
    try {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: ipAddress || "unknown",
          userAgent: userAgent || "unknown",
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

    const payload = this.buildAccessPayload(user);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.persistRefreshToken(user.id, refreshToken, ipAddress, userAgent);

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

  async sendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found with provided email", 404);
    }

    const { message } = await this.otpService.generateAndSendOtp(email);

    return { message };
  }

  async verifyOtp(email: string, otp: string): Promise<IAuthUserResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found with provided email", 404);
    }

    const isValid = await this.otpService.verifyEmailCode(email, otp);
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
  ): Promise<{ success: boolean; message: string; timerSeconds: number }> {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new AppError(
        "Valid phone number with country code is required",
        400,
      );
    }

    const result = await this.otpService.generateAndSendPhoneOtp(cleanPhone);

    return {
      success: true,
      message: result.message,
      timerSeconds: result.timerSeconds,
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
  ): Promise<{ success: boolean; message: string }> {
    if (!email) throw new AppError("Email address is required", 400);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found with provided email", 404);
    }

    const { code, expiresAt } = await this.otpService.generateAndSendEmailVerification(email);

    await prisma.otpToken.create({
      data: {
        email,
        otp: code,
        purpose: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    return {
      success: true,
      message: `Email verification code sent to ${email}`,
    };
  }

  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!email || !code)
      throw new AppError("Email and verification code are required", 400);

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      throw new AppError("Invalid verification code", 400);
    }

    const isValid = await this.otpService.verifyEmailCode(email, code);

    if (!isValid) {
      throw new AppError("Invalid verification code", 400);
    }

    await this.userRepository.markEmailVerified(email);

    return {
      success: true,
      message: "Email address verified successfully!",
    };
  }

  async enableTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string; qrCodeImage: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const secret = TotpService.generateSecret();
    const qrCodeUrl = TotpService.generateQrCodeUrl(secret, user.email, "RoomBae");
    const qrCodeImage = await TotpService.generateQrCodeImage(secret, user.email, "RoomBae");

    await this.userRepository.updateTwoFactor(userId, secret, true, "TOTP");

    return { secret, qrCodeUrl, qrCodeImage };
  }

  async verifyTwoFactor(
    userId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (!user.twoFactorSecret) {
      throw new AppError("Two-factor authentication not set up", 400);
    }

    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      throw new AppError("Invalid 6-digit Authenticator code", 400);
    }

    const isValid = TotpService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new AppError("Invalid two-factor authentication code", 401, "TWO_FACTOR_INVALID");
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