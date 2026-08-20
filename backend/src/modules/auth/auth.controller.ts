import { Request, Response, NextFunction } from "express";
import { IAuthService } from "../../interfaces/services/IAuthService";
import { ApiResponse } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/appError";
import { env } from "../../config/env";
import { Container } from "../../container";
import { logger } from "../../utils/logger";
import passport from "passport";
import crypto from "crypto";

const isProduction = env.NODE_ENV === "production";

const getRefreshTokenCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge,
});

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = catchAsync(async (req: Request, res: Response) => {
    const { email, phone, residentCode, identifier, password, rememberMe, isRememberMe: isRememberMeParam } = req.body;
    const loginId = identifier || email || phone || residentCode;
    const isRememberMe = typeof isRememberMeParam === "boolean" ? isRememberMeParam : Boolean(rememberMe);

    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const visitorId = (req.headers["x-visitor-id"] as string) || req.body.visitorId;

    const result = await this.authService.login(loginId, password, {
      rememberMe: isRememberMe,
      ipAddress,
      userAgent,
      visitorId,
    });

    if (result && result.requiresTwoFactor) {
      return ApiResponse.success(res, result.message || "Two-factor authentication code required", {
        requiresTwoFactor: true,
        preAuthToken: result.preAuthToken,
      });
    }

    let deviceSecurity: any = null;
    const effectiveVisitorId = visitorId || "anonymous_device";

    if (result?.user?.id) {
      try {
        const requestId = (req as any).correlationId;

        const evalResult = await Container.deviceService.identifyAndEvaluateDevice(
          result.user.id,
          {
            visitorId: effectiveVisitorId,
            deviceLabel: req.body.deviceLabel || "Browser Client",
            screenResolution: req.body.screenResolution,
          },
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
          requiresAlert: evalResult.requiresAlert,
          deviceId: evalResult.device?.id,
          visitorId: effectiveVisitorId,
          deviceLabel: evalResult.device?.deviceLabel || evalResult.telemetry?.deviceLabel,
          screenResolution: evalResult.telemetry?.screenResolution || evalResult.device?.screenResolution,
          ipAddress: evalResult.telemetry?.ip,
          region: evalResult.telemetry?.region,
          status: evalResult.device?.status,
          riskLevel: evalResult.risk?.level,
          stepUpRequired,
        };
      } catch (deviceError) {
        logger.warn("Device security evaluation notice:", deviceError);
      }
    }

    const cookieMaxAge = isRememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions(cookieMaxAge));

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

    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions(7 * 24 * 60 * 60 * 1000));

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

    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions(7 * 24 * 60 * 60 * 1000));

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

    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions(7 * 24 * 60 * 60 * 1000));

    return ApiResponse.success(res, "Phone OTP verified successfully", result);
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];

    if (refreshToken || accessToken) {
      await this.authService.logout(refreshToken || "", accessToken, ipAddress, userAgent);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    res.clearCookie("accessToken", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    return ApiResponse.success(res, "Logged out successfully", { success: true });
  });

  logoutAll = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];

    if (this.authService.logoutAll) {
      await this.authService.logoutAll(userId, ipAddress, userAgent);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    res.clearCookie("accessToken", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    return ApiResponse.success(res, "All active sessions revoked successfully", { success: true });
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
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const result = await this.authService.enableTwoFactor(userId);
    return ApiResponse.success(
      res,
      "2FA QR code generated successfully",
      result,
    );
  });

  verifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const { preAuthToken, token, rememberMe } = req.body;
    if (!preAuthToken) {
      return res.status(401).json({
        success: false,
        message: "Verification session token (preAuthToken) required",
      });
    }

    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const visitorId = (req.headers["x-visitor-id"] as string) || req.body.visitorId;

    const result = await this.authService.verifyTwoFactor(preAuthToken, token, rememberMe, ipAddress, userAgent, visitorId);

    if (result && result.refreshToken) {
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: cookieMaxAge,
      });
    }

    return ApiResponse.success(res, result.message, result);
  });

  disableTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const result = await this.authService.disableTwoFactor(userId);
    return ApiResponse.success(res, result.message, result);
  });

  refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined);
    const result = await this.authService.refreshToken(token);

    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions(7 * 24 * 60 * 60 * 1000));

    return ApiResponse.success(res, "Access token refreshed and rotated", {
      accessToken: result.accessToken,
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

    const statePayload = JSON.stringify({
      role: roleParam,
      frontendUrl: targetFrontendUrl,
      nonce: crypto.randomBytes(16).toString("hex"),
      timestamp: Date.now(),
    });
    const oauthSecret = env.OAUTH_STATE_SECRET || env.JWT_SECRET;
    const stateSig = crypto.createHmac("sha256", oauthSecret).update(statePayload).digest("hex");
    const state = Buffer.from(JSON.stringify({ p: statePayload, s: stateSig })).toString("base64url");

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
            const rawState = req.query.state as string;
            const decodedJson = JSON.parse(
              Buffer.from(rawState, rawState.includes("-") || rawState.includes("_") ? "base64url" : "base64").toString("utf-8")
            );
            if (decodedJson?.p && decodedJson?.s) {
              const oauthSecret = env.OAUTH_STATE_SECRET || env.JWT_SECRET;
              const expectedSig = crypto.createHmac("sha256", oauthSecret).update(decodedJson.p).digest("hex");
              if (expectedSig === decodedJson.s) {
                const payload = JSON.parse(decodedJson.p);
                if (payload?.frontendUrl) {
                  targetFrontendUrl = normalizeFrontendUrl(payload.frontendUrl);
                }
              }
            } else if (decodedJson?.frontendUrl) {
              targetFrontendUrl = normalizeFrontendUrl(decodedJson.frontendUrl);
            }
          } catch {
            // keep fallback
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

          res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions(7 * 24 * 60 * 60 * 1000));

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

function normalizeFrontendUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.includes("ayushman-glb.github.io") && !url.includes("PG-Management-System")) {
    url = `${url.replace(/\/$/, "")}/PG-Management-System`;
  }
  return url;
}

function resolveFrontendUrl(req: Request): string {
  let candidate = (req.headers.origin as string) || (req.headers.referer as string);
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      let origin = parsed.origin;
      if (origin.includes("ayushman-glb.github.io")) {
        return "https://ayushman-glb.github.io/PG-Management-System";
      }
      return origin;
    } catch {}
  }
  return env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:5173";
}
