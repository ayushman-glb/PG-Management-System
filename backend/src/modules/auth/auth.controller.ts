import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    if (accessToken) {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
      });
    }
    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
  }

  private clearCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
  }

  registerResident = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, phone, username, password, firstName, lastName, currentAddress, gender, dateOfBirth, occupation, acceptedTermsVersion, acceptedPrivacyVersion, visitorId, deviceLabel } = req.body;
      if (!email || !phone || !username || !password || !firstName || !lastName) {
        throw new BadRequestError('Email, phone, username, password, first name, and last name are required.');
      }

      const result = await this.authService.registerResident({
        email,
        phone,
        username,
        password,
        firstName,
        lastName,
        currentAddress,
        gender,
        dateOfBirth,
        occupation,
        acceptedTermsVersion,
        acceptedPrivacyVersion,
        visitorId,
        deviceLabel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, result.message, result.user, 201);
    } catch (error) {
      next(error);
    }
  };

  registerOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, phone, username, password, firstName, lastName, currentAddress, numPGsToRegister, acceptedTermsVersion, acceptedPrivacyVersion, visitorId, deviceLabel } = req.body;
      if (!email || !phone || !username || !password || !firstName || !lastName) {
        throw new BadRequestError('Email, phone, username, password, first name, and last name are required.');
      }

      const result = await this.authService.registerOwner({
        email,
        phone,
        username,
        password,
        firstName,
        lastName,
        currentAddress,
        numPGsToRegister,
        acceptedTermsVersion,
        acceptedPrivacyVersion,
        visitorId,
        deviceLabel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, result.message, result.user, 201);
    } catch (error) {
      next(error);
    }
  };

  verifyEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) throw new BadRequestError('Email and OTP code are required.');

      await this.authService.verifyEmailOTP(email, otp);
      return ApiResponse.success(res, 'Email verified successfully. You may now sign in.');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, password, visitorId, deviceLabel } = req.body;
      if (!identifier || typeof identifier !== 'string' || !password || typeof password !== 'string') {
        throw new BadRequestError('Identifier (email/username/phone) and password must be valid strings.');
      }

      const result = await this.authService.login(identifier, password, {
        visitorId,
        deviceLabel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (!result.require2FA) {
        this.setCookies(res, result.accessToken, result.refreshToken);
      }

      return ApiResponse.success(res, result.require2FA ? '2FA Code dispatched to registered email.' : 'Login successful.', result);
    } catch (error) {
      next(error);
    }
  };

  verify2FA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { twoFactorToken, otp, visitorId } = req.body;
      if (!twoFactorToken || !otp) throw new BadRequestError('2FA token and OTP code are required.');

      const result = await this.authService.verify2FA(twoFactorToken, otp, {
        visitorId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      this.setCookies(res, result.accessToken, result.refreshToken);
      return ApiResponse.success(res, 'Two-Factor Authentication verified successfully.', result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) throw new BadRequestError('Refresh token required.');

      const result = await this.authService.refreshToken(refreshToken, req.ip, req.headers['user-agent']);
      this.setCookies(res, result.accessToken, result.refreshToken);
      return ApiResponse.success(res, 'Tokens refreshed successfully.', result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await this.authService.logout(refreshToken);
      this.clearCookies(res);
      return ApiResponse.success(res, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');
      await this.authService.logoutAllDevices(user.id);
      this.clearCookies(res);
      return ApiResponse.success(res, 'Logged out from all devices successfully.');
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');
      const userProfile = await this.authService.getMe(user.id);
      return ApiResponse.success(res, 'User profile retrieved.', userProfile);
    } catch (error) {
      next(error);
    }
  };

  transferPrimaryDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');
      const { currentPrimaryDeviceId, targetDeviceId } = req.body;
      if (!currentPrimaryDeviceId || !targetDeviceId) {
        throw new BadRequestError('currentPrimaryDeviceId and targetDeviceId are required.');
      }

      await this.authService.transferPrimaryDevice(user.id, currentPrimaryDeviceId, targetDeviceId);
      return ApiResponse.success(res, 'Primary device ownership transferred successfully.');
    } catch (error) {
      next(error);
    }
  };

  initiateGoogleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = (req.query.role as any) || 'RESIDENT';
      const redirectUrl = req.query.redirectUrl as string;
      const authUrl = this.authService.initiateGoogleAuth(role, redirectUrl);

      // Support JSON response if requested via accept header or query param
      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        return ApiResponse.success(res, 'Google OAuth URL generated.', { authUrl });
      }

      return res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  };

  handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state, error } = req.query;
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (error) {
        return res.redirect(`${frontendBase}/?oauth=error&error=${encodeURIComponent(String(error))}`);
      }

      if (!code || typeof code !== 'string') {
        return res.redirect(`${frontendBase}/?oauth=error&error=Missing+authorization+code`);
      }

      const result = await this.authService.handleGoogleAuth({
        code,
        state: typeof state === 'string' ? state : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (result.requireAccountLinking) {
        return res.redirect(
          `${frontendBase}/?oauth=account_exists&email=${encodeURIComponent(result.existingEmail || '')}`
        );
      }

      if (result.require2FA) {
        return res.redirect(
          `${frontendBase}/?oauth=2fa_required&preAuthToken=${encodeURIComponent(result.preAuthToken || '')}`
        );
      }

      if (result.accessToken && result.refreshToken) {
        this.setCookies(res, result.accessToken, result.refreshToken);

        const targetPage = !result.isProfileComplete
          ? 'complete-profile'
          : result.user.role === 'RESIDENT'
          ? 'resident-portal'
          : 'dashboard';

        return res.redirect(
          `${frontendBase}/?page=${targetPage}&oauth=success&role=${result.user.role}&token=${encodeURIComponent(result.accessToken)}`
        );
      }

      return res.redirect(`${frontendBase}/?oauth=success`);
    } catch (error: any) {
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendBase}/?oauth=error&error=${encodeURIComponent(error.message || 'OAuth verification failed')}`);
    }
  };

  verifyGoogleToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken, role, visitorId, deviceLabel, screenResolution } = req.body;
      if (!idToken) {
        throw new BadRequestError('Google ID token is required.');
      }

      const result = await this.authService.handleGoogleAuth({
        idToken,
        role,
        visitorId,
        deviceLabel,
        screenResolution,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (result.accessToken && result.refreshToken) {
        this.setCookies(res, result.accessToken, result.refreshToken);
      }

      return ApiResponse.success(res, result.message || 'Google authentication processed.', result);
    } catch (error) {
      next(error);
    }
  };

  linkGoogle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');
      const { idToken, password, twoFactorCode } = req.body;
      if (!idToken) throw new BadRequestError('Google ID token is required.');

      const result = await this.authService.linkGoogleAccount(user.id, {
        idToken,
        password,
        twoFactorCode,
      });

      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  unlinkGoogle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');
      const { password } = req.body;

      const result = await this.authService.unlinkGoogleAccount(user.id, { password });
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  createPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');
      const { password } = req.body;
      if (!password) throw new BadRequestError('Password is required.');

      const result = await this.authService.createPasswordForGoogleUser(
        user.id,
        { password },
        {
          visitorId: req.body?.visitorId,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        }
      );

      this.setCookies(res, result.accessToken, result.refreshToken);
      return ApiResponse.success(res, result.message, { accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  };

  completeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');

      const result = await this.authService.completeProfile(user.id, {
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, result.message, result.user);
    } catch (error) {
      next(error);
    }
  };

  getAuthMethods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) throw new BadRequestError('User context missing.');

      const methods = await this.authService.getAuthMethods(user.id);
      return ApiResponse.success(res, 'Authentication methods retrieved.', methods);
    } catch (error) {
      next(error);
    }
  };
}
