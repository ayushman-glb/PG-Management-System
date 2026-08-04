import { Request, Response } from "express";
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
      secure: process.env.NODE_ENV === "production",
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
      secure: process.env.NODE_ENV === "production",
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
      secure: process.env.NODE_ENV === "production",
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
    const result = await this.authService.firebaseLogin(idToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, "Firebase authentication verified", result);
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

  googleLogin = catchAsync(async (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "https://ayushman-glb.github.io/PG-Management-System/"}?error=google_not_configured`,
      );
    }

    const roleParam = req.query.role ? String(req.query.role) : "OWNER";
    const scope = "openid email profile";
    const responseType = "code";
    const state = Math.random().toString(36).substring(2, 15);

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri || "")}` +
      `&response_type=${responseType}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&role=${encodeURIComponent(roleParam)}`;

    return res.redirect(authUrl);
  });

  googleCallback = catchAsync(async (req: Request, res: Response) => {
    const { code, error, role } = req.query;
    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://ayushman-glb.github.io/PG-Management-System/";

    if (error || !code) {
      return res.redirect(
        `${frontendUrl}?error=${encodeURIComponent(String(error || "google_auth_failed"))}`,
      );
    }

    try {
      const result = await this.authService.googleAuth(
        String(code),
        role as any,
      );

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const redirectParams = new URLSearchParams({
        token: result.accessToken,
        user: JSON.stringify(result.user),
        role: result.user.role,
      });
      return res.redirect(`${frontendUrl}?${redirectParams.toString()}`);
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}?error=${encodeURIComponent(err?.message || "google_auth_failed")}`,
      );
    }
  });
}
