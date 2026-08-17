import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { phoneAuthService, PhoneAuthService } from './phoneAuth.service';
import { phoneSecurityService } from './security.service';

export class PhoneAuthController {
  private service: PhoneAuthService;

  constructor(service: PhoneAuthService = phoneAuthService) {
    this.service = service;
  }

  /**
   * POST /api/v1/auth/phone/send-otp
   */
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = phoneSecurityService.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const { phone, purpose } = req.body;

      const result = await this.service.sendOtp({
        phone,
        purpose,
        ipAddress,
        userAgent,
      });

      ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/phone/verify-otp
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = phoneSecurityService.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const { phone, otp, purpose } = req.body;
      const userId = (req as any).user?.id || (req as any).user?.userId;

      const result = await this.service.verifyOtp({
        phone,
        otp,
        purpose,
        userId,
        ipAddress,
        userAgent,
      });

      ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/phone/resend-otp
   */
  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = phoneSecurityService.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const { phone } = req.body;

      const result = await this.service.resendOtp({
        phone,
        ipAddress,
        userAgent,
      });

      ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/phone/status
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const phone = (req.query.phone as string) || (req.body?.phone as string);
      const userId = (req as any).user?.id || (req as any).user?.userId;

      const result = await this.service.getStatus(phone, userId);

      ApiResponse.success(res, 'Phone authentication status retrieved.', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/auth/phone/remove
   */
  async removePhone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      const ipAddress = phoneSecurityService.getClientIp(req);

      const result = await this.service.removePhone(userId, ipAddress);

      ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }
}

export const phoneAuthController = new PhoneAuthController();
