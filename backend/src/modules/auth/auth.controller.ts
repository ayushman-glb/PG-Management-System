import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Container } from "../../container";
import { env } from "../../config/env";
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

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
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
    res.clearCookie("refreshToken");
    return ApiResponse.success(res, "Logout successful");
  });

  firebaseLogin = catchAsync(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const result = await this.authService.phoneVerify(idToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Phone verification successful", result);
  });

  phoneVerify = catchAsync(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const result = await this.authService.phoneVerify(idToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Phone verification successful", result);
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
    const token = req.cookies.refreshToken || req.body.refreshToken;
    const result = await this.authService.refreshToken(token);
    return ApiResponse.success(res, "Access token refreshed", result);
  });

  me = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      // Demo-friendly fallback: return a default owner profile when no token is present.
      return ApiResponse.success(res, "Current user details (demo)", {
        id: "650000000000000000000001",
        name: "Rajesh Kumar",
        email: "owner1@roombae.com",
        role: "OWNER",
        residentCode: undefined,
        avatarUrl: undefined,
      });
    }
    const result = await this.authService.me(userId);
    return ApiResponse.success(res, "Current user details", result);
  });

  googleLogin = (req: Request, res: Response, next: NextFunction) => {
    const roleParam = req.query.role ? String(req.query.role) : "OWNER";
    const referer = req.headers.referer || req.headers.origin || "";
    let frontendUrl =
      env.FRONTEND_URL ||
      env.CLIENT_URL ||
      (env.NODE_ENV === "production"
        ? "https://ayushman-glb.github.io/PG-Management-System"
        : "http://localhost:5173");

    if (referer) {
      try {
        const parsed = new URL(String(referer));
        frontendUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, "")}`;
      } catch {
        // keep fallback
      }
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      const baseUrl = frontendUrl.replace(/\/$/, "");
      return res.redirect(
        `${baseUrl}?error=${encodeURIComponent("Google OAuth credentials are not configured on the server.")}`
      );
    }

    const stateObj = { role: roleParam, frontendUrl };
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
        let frontendUrl =
          env.FRONTEND_URL ||
          env.CLIENT_URL ||
          (env.NODE_ENV === "production"
            ? "https://ayushman-glb.github.io/PG-Management-System"
            : "http://localhost:5173");

        if (req.query?.state) {
          try {
            const stateObj = JSON.parse(
              Buffer.from(req.query.state as string, "base64").toString("utf-8")
            );
            if (stateObj?.frontendUrl) {
              frontendUrl = stateObj.frontendUrl;
            }
          } catch {
            // ignore
          }
        }

        const baseUrl = frontendUrl.replace(/\/$/, "");

        if (err || !user) {
          console.error("Google OAuth authentication error:", err || info);
          const errorMsg = encodeURIComponent(
            err?.message || info?.message || "google_auth_failed"
          );
          return res.redirect(`${baseUrl}?error=${errorMsg}`);
        }

        try {
          const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            residentCode: user.residentCode || undefined,
          };

          const accessToken = Container.tokenService.generateAccessToken(payload);
          const refreshToken = Container.tokenService.generateRefreshToken(payload);

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          const userDto = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            residentCode: user.residentCode || undefined,
            avatarUrl: user.avatarUrl,
          };

          const redirectParams = new URLSearchParams({
            token: accessToken,
            user: JSON.stringify(userDto),
            role: user.role,
          });

          return res.redirect(`${baseUrl}?${redirectParams.toString()}`);
        } catch (error: any) {
          console.error("Error generating tokens in googleCallback:", error);
          return res.redirect(
            `${baseUrl}?error=${encodeURIComponent(error?.message || "token_generation_failed")}`
          );
        }
      }
    )(req, res, next);
  };
}
