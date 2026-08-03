import { Request, Response } from 'express';
import { IAuthService } from '../../interfaces/services/IAuthService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = catchAsync(async (req: Request, res: Response) => {
    const { identifier, email, residentCode, password } = req.body;
    const loginId = identifier || email || residentCode;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (email/residentCode) and password are required'
      });
    }

    const result = await this.authService.login(loginId, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken
    });
  });

  register = catchAsync(async (req: Request, res: Response) => {
    const { name, email, password, role, phone } = req.body;
    const result = await this.authService.register({ name, email, password, role, phone });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, 'Registration successful', {
      user: result.user,
      accessToken: result.accessToken
    }, 201);
  });

  sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.authService.sendOtp(email);
    return ApiResponse.success(res, result.message, {});
  });

  verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await this.authService.verifyOtp(email, otp);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, 'OTP verified successfully', result);
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    return ApiResponse.success(res, 'Logout successful');
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
    const userId = (req as any).user?.id || req.body.userId || 'USER_CURRENT';
    const result = await this.authService.enableTwoFactor(userId);
    return ApiResponse.success(res, '2FA QR code generated successfully', result);
  });

  verifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId || 'USER_CURRENT';
    const { token } = req.body;
    const result = await this.authService.verifyTwoFactor(userId, token);
    return ApiResponse.success(res, result.message, result);
  });

  disableTwoFactor = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId || 'USER_CURRENT';
    const result = await this.authService.disableTwoFactor(userId);
    return ApiResponse.success(res, result.message, result);
  });

  refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    const result = await this.authService.refreshToken(token);
    return ApiResponse.success(res, 'Access token refreshed', result);
  });

  me = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'USER_CURRENT';
    const result = await this.authService.me(userId);
    return ApiResponse.success(res, 'Current user details', result);
  });

  googleCallback = catchAsync(async (req: Request, res: Response) => {
    return ApiResponse.success(res, 'Google OAuth callback handler', { message: 'Google authentication verified' });
  });
}
