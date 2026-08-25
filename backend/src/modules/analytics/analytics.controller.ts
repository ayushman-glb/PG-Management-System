import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getOwnerAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const data = await this.analyticsService.getOwnerAnalytics(req.user.id, pgId as string);
      return ApiResponse.success(res, 'Owner analytics retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getRevenueAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { period, pgId } = req.query;
      const data = await this.analyticsService.getRevenueAnalytics(req.user.id, period as string, pgId as string);
      return ApiResponse.success(res, 'Revenue analytics retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getOccupancyAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const data = await this.analyticsService.getOccupancyAnalytics(req.user.id, pgId as string);
      return ApiResponse.success(res, 'Occupancy analytics retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getProfitLossAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId, startDate, endDate } = req.query;
      const data = await this.analyticsService.getProfitLoss(req.user.id, pgId as string, startDate as string, endDate as string);
      return ApiResponse.success(res, 'Profit & Loss analytics retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getAdminAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.analyticsService.getAdminPlatformAnalytics();
      return ApiResponse.success(res, 'Admin platform analytics retrieved.', data);
    } catch (error) {
      next(error);
    }
  };
}
