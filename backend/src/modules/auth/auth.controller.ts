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
    const { identifier, email, residentCode, password } = req.body;
    const loginId = identifier || email || residentCode;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (email/residentCode) and password are required",
      });
    }

    const result = await this.authService.login(loginId, password);

    const visitorId = (req.headers["x-visitor-id"] as string) || req.body.visitorId;
    let deviceSecurity: any = null;

    if (visitorId && result?.user?.id) {
      try {
        const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
        const userAgent = req.headers["user-agent"];
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

        deviceSecurity = {
          isNewDevice: evalResult.isNew,
          status: evalResult.device?.status,
          riskLevel: evalResult.risk?.level,
        };
      } catch (deviceError) {
        logger.warn("Device security evaluation notice:", deviceError);
      }
    }

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
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
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(
      res,
      "Registration successful",
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      201,
    );
  });

  sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.authService.sendOtp(email);
    return ApiResponse.success(res, result.message, {});
  });

  verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await this.authService.verifyOtp(email, otp);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "OTP verified successfully", result);
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined);
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.clearCookie("accessToken", {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return ApiResponse.success(res, "Logged out successfully", { success: true });
  });

  testEmail = catchAsync(async (req: Request, res: Response) => {

    const { email } = req.body;
    const { emailService } = await import("../../services/email");
    const success = await emailService.sendOTPEmail(email || "test@roombae.com", "998877", "Test User");
    if (success) {
      return ApiResponse.success(res, "Test email sent successfully via Brevo SMTP", { email });
    }
    return res.status(500).json({ success: false, message: "Failed to send test email via Brevo SMTP" });
  });

  sendPhoneOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await this.authService.sendPhoneOtp(phone);
    return ApiResponse.success(res, result.message, result);
  });

  verifyPhoneOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const result = await this.authService.verifyPhoneOtp(phone, otp);
    return ApiResponse.success(res, result.message, result);
  });

  sendEmailVerification = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.authService.sendEmailVerification(email);
    return ApiResponse.success(res, result.message, result);
  });

  verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const result = await this.authService.verifyEmail(email, code);
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
    const userId = (req as any).user?.id || req.body.userId || "USER_CURRENT";
    const { token } = req.body;
    const result = await this.authService.verifyTwoFactor(userId, token);
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
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Access token refreshed and rotated", {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
            sameSite: "lax",
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
