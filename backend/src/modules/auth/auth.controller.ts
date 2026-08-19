import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Container } from "../../container";
import { env } from "../../config/env";
import { resolveFrontendUrl, normalizeFrontendUrl } from "../../config/frontendUrl";
import { logger } from "../../utils/logger";
import { IAuthService } from "../../interfaces/services/IAuthService";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = catchAsync(async (req: Request, res: Response) => {
    const { identifier, email, phone, residentCode, password, rememberMe } = req.body;
    const loginId = identifier || email || phone || residentCode;
    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (email/phone/residentCode) and password are required",
      });
    }

    const isRememberMe = Boolean(rememberMe);
    const result = await this.authService.login(loginId, password, isRememberMe, ipAddress, userAgent);

    if (result && result.requiresTwoFactor) {
      return ApiResponse.success(res, result.message || "Two-factor authentication code required", {
        requiresTwoFactor: true,
        preAuthToken: result.preAuthToken,
      });
    }

    const visitorId = (req.headers["x-visitor-id"] as string) || req.body.visitorId;
    let deviceSecurity: any = null;

    if (visitorId && result?.user?.id) {
      try {
        const requestId = (req as any).correlationId;

        const evalResult = await Container.deviceService.identifyAndEvaluateDevice(
          result.user.id,
          { visitorId, deviceLabel: req.body.deviceLabel },
          { ipAddress, userAgent, requestId },
        );

        if (evalResult?.device?.status === "BLOCKED") {
          return res.status(403).json({
            success: false,
            message: "Authentication denied: This browser/device has been blocked by security policy.",
          });
        }

        let stepUpRequired = false;
        if (evalResult?.device?.status === "REVOKED") {
          stepUpRequired = true;
        }

        deviceSecurity = {
          isNewDevice: evalResult.isNew,
          status: evalResult.device?.status,
          riskLevel: evalResult.risk?.level,
          stepUpRequired,
        };
      } catch (deviceError) {
        logger.warn("Device security evaluation notice:", deviceError);
      }
    }

    const cookieMaxAge = isRememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: cookieMaxAge,
    });

    return ApiResponse.success(res, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
      // refreshToken intentionally omitted — httpOnly cookie only (see RFC 6749 §10.3)
      deviceSecurity,
    });
  });

  register = catchAsync(async (req: Request, res: Response) => {
    const { name, email, password, role, phone } = req.body;
    const result = await this.authService.register({
      name,
      email,
      password,
      role,
      phone,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Strip refreshToken from the response data — cookie-only, never in body
    const { refreshToken: _rt, ...safeResult } = result as any;
    return ApiResponse.success(res, "User registered successfully", safeResult, 201);
  });

  sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, phone } = req.body;
    const target = email || phone;
    const result = await this.authService.sendOtp(target);
    return ApiResponse.success(res, result.message, result);
  });

  verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, phone, otp } = req.body;
    const target = email || phone;
    const result = await this.authService.verifyOtp(target, otp);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "OTP verified successfully", result);
  });

  sendPhoneOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await this.authService.sendPhoneOtp(phone);
    return ApiResponse.success(res, result.message, result);
  });

  verifyPhoneOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const result = await this.authService.verifyOtp(phone, otp);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Phone OTP verified successfully", result);
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined);
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.clearCookie("accessToken", {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });
    return ApiResponse.success(res, "Logged out successfully", { success: true });
  });

  testEmail = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const { emailService } = await import("../../services/email");
    const success = await emailService.sendOTPEmail(email || "test@roombae.com", "998877", "Test User");
    if (success) {
      return ApiResponse.success(res, "Test email sent successfully", { email });
    }
    return res.status(500).json({ success: false, message: "Failed to send test email" });
  });



  sendEmailOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, name } = req.body;
    const result = await this.authService.sendEmailVerification(email, name);
    return ApiResponse.success(res, result.message, result);
  });

  verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otp, code } = req.body;
    const verificationCode = otp || code;
    const result = await this.authService.verifyEmail(email, verificationCode);
    return ApiResponse.success(res, result.message, result);
  });

  resendEmailOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, name } = req.body;
    const result = await this.authService.sendEmailVerification(email, name);
    return ApiResponse.success(res, result.message, result);
  });

  sendPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (this.authService.sendPasswordReset) {
      const result = await this.authService.sendPasswordReset(email);
      return ApiResponse.success(res, result.message, result);
    }
    return ApiResponse.success(res, "Password reset initiated", {});
  });

  verifyPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { email, otp, code, newPassword } = req.body;
    const verificationCode = otp || code;
    if (this.authService.verifyPasswordReset) {
      const result = await this.authService.verifyPasswordReset(email, verificationCode, newPassword);
      return ApiResponse.success(res, result.message, result);
    }
    return ApiResponse.success(res, "Password reset verified", {});
  });

  sendEmailVerification = catchAsync(async (req: Request, res: Response) => {
    const { email, name } = req.body;
    const result = await this.authService.sendEmailVerification(email, name);
    return ApiResponse.success(res, result.message, result);
  });

  verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, code, otp } = req.body;
    const verificationCode = code || otp;
    const result = await this.authService.verifyEmail(email, verificationCode);
    return ApiResponse.success(res, result.message, result);
  });

  enableTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId || "USER_CURRENT";
    const result = await this.authService.enableTwoFactor(userId);
    return ApiResponse.success(
      res,
      "2FA QR code generated successfully",
      result,
    );
  });

  verifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const { preAuthToken, userId: bodyUserId, token, rememberMe } = req.body;
    const tokenOrUserId = preAuthToken || bodyUserId || (req as any).user?.id || "USER_CURRENT";
    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];

    const result = await this.authService.verifyTwoFactor(tokenOrUserId, token, rememberMe, ipAddress, userAgent);

    if (result && result.refreshToken) {
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: cookieMaxAge,
      });
    }

    return ApiResponse.success(res, result.message, result);
  });

  disableTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId || "USER_CURRENT";
    const result = await this.authService.disableTwoFactor(userId);
    return ApiResponse.success(res, result.message, result);
  });

  refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined);
    const result = await this.authService.refreshToken(token);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Access token refreshed and rotated", {
      accessToken: result.accessToken,
      // refreshToken intentionally omitted — httpOnly cookie only
    });
  });

  me = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_REQUIRED",
          message: "Authentication required. Please log in.",
        },
      });
    }
    const result = await this.authService.me(userId);
    return ApiResponse.success(res, "Current user details", {
      user: result,
      ...result,
    });
  });

  googleLogin = (req: Request, res: Response, next: NextFunction) => {
    const rawRole = req.query.role ? String(req.query.role).toUpperCase() : "RESIDENT";
    const roleParam = (rawRole === "OWNER" || rawRole === "RESIDENT") ? rawRole : "RESIDENT";
    const targetFrontendUrl = resolveFrontendUrl(req);

    logger.info("🔑 Initiating Google OAuth Flow", {
      role: roleParam,
      referer: req.headers.referer,
      origin: req.headers.origin,
      targetFrontendUrl,
    });

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      logger.error("❌ Google OAuth failed: Credentials missing in server configuration.");
      return res.redirect(
        `${targetFrontendUrl}?error=${encodeURIComponent("Google OAuth credentials are not configured on the server.")}`
      );
    }

    const stateObj = { role: roleParam, frontendUrl: targetFrontendUrl };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    passport.authenticate("google", {
      scope: ["openid", "email", "profile"],
      accessType: "offline",
      prompt: "consent",
      state,
      session: false,
    })(req, res, next);
  };

  googleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "google",
      { session: false },
      async (err: any, user: any, info: any) => {
        let targetFrontendUrl = resolveFrontendUrl(req);

        if (req.query?.state) {
          try {
            const stateObj = JSON.parse(
              Buffer.from(req.query.state as string, "base64").toString("utf-8")
            );
            if (stateObj?.frontendUrl) {
              targetFrontendUrl = normalizeFrontendUrl(stateObj.frontendUrl);
            }
          } catch {
            // keep resolved fallback
          }
        }

        logger.info("📥 Google OAuth Callback Received", {
          hasUser: !!user,
          hasError: !!err,
          targetFrontendUrl,
        });

        if (err || !user) {
          logger.error("❌ Google OAuth Authentication Error", {
            error: err?.message || info?.message || "google_auth_failed",
            targetFrontendUrl,
          });
          const errorMsg = encodeURIComponent(
            err?.message || info?.message || "google_auth_failed"
          );
          return res.redirect(`${targetFrontendUrl}?error=${errorMsg}`);
        }

        try {
          const { accessToken, refreshToken } = await this.authService.generateOAuthTokens(
            user,
            req.ip,
            req.headers["user-agent"] as string
          );

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          const targetParams = new URLSearchParams();
          targetParams.set("oauth", "success");
          targetParams.set("role", user.role);
          if (user.residentCode) targetParams.set("code", user.residentCode);

          const finalRedirectUrl = `${targetFrontendUrl}?${targetParams.toString()}`;

          logger.info("Google OAuth success -> redirect (cookie-based)", {
            userId: user.id,
            email: user.email,
          });

          return res.redirect(finalRedirectUrl);
        } catch (error: any) {
          logger.error("❌ Error generating JWT tokens in googleCallback", {
            error: error?.message,
            targetFrontendUrl,
          });
          return res.redirect(
            `${targetFrontendUrl}?error=${encodeURIComponent(error?.message || "token_generation_failed")}`
          );
        }
      }
    )(req, res, next);
  };
}
