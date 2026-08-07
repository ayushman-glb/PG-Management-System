import {
  IAuthService,
  IAuthUserResult,
  IRegisterData,
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

const CLOUDINARY_DEFAULT_AVATAR = "https://res.cloudinary.com/roombae/image/upload/v1700000000/default-avatar.png";
const CLOUDINARY_DEFAULT_OWNER_PHOTO = "https://res.cloudinary.com/roombae/image/upload/v1700000000/default-owner.png";

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cryptoService: ICryptoService,
    private readonly tokenService: ITokenService,
    private readonly otpService: IOtpService,
  ) {}

  async googleAuth(code: string, role?: Role): Promise<IAuthUserResult> {
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

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      residentCode: user.residentCode || undefined,
    };

    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        residentCode: user.residentCode || undefined,
        avatarUrl: user.avatarUrl,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async login(identifier: string, password: string): Promise<IAuthUserResult> {
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

    if (user.phoneVerified !== true) {
      logger.warn("Login failed: phone not verified", { userId: user.id });
    }

    try {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: "unknown",
          userAgent: "unknown",
          status: "SUCCESS",
        },
      });
    } catch (err: any) {
      logger.debug("LoginHistory record creation skipped", { userId: user.id, error: err.message });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      residentCode: user.residentCode || undefined,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    logger.info("Login successful", { userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        residentCode: user.residentCode || undefined,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(data: IRegisterData): Promise<IAuthUserResult> {
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

    const payload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) throw new AppError("Refresh token required", 401, "TOKEN_REQUIRED", "login");
    let decoded: any;
    try {
      decoded = this.tokenService.verifyRefreshToken(token);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("Refresh token has expired. Please log in again.", 401, "REFRESH_TOKEN_EXPIRED", "login");
      }
      throw new AppError("Invalid refresh token signature.", 401, "INVALID_REFRESH_TOKEN", "login");
    }

    const payload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      residentCode: decoded.residentCode,
    };

    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async me(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    let profile: any = null;
    if (user.role === Role.OWNER) {
      profile = await prisma.owner.findFirst({
        where: { userId: user.id },
        include: { pgs: true },
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
      try {
        owner = await prisma.owner.create({
          data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "+919876543210",
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
      logger.info("Auto-creating resident profile", { userId: user.id });
      try {
        const defaultPg = await prisma.pG.findFirst();
        const defaultBed = await prisma.bed.findFirst();

        if (defaultPg && defaultBed) {
          resident = await prisma.resident.create({
            data: {
              userId: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || "",
              profilePicture: user.avatarUrl || CLOUDINARY_DEFAULT_AVATAR,
              pgId: defaultPg.id,
              bedId: defaultBed.id,
              status: "ACTIVE",
            },
            include: { bed: true, pg: true },
          });
        }
      } catch (err) {
        logger.warn("Could not auto-create resident record", { userId: user.id, error: err });
      }
    }

    return { user, resident: resident || null };
  }
}
