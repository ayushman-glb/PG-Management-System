import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { catchAsync } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService = new DashboardService()) {}

  /**
   * GET /api/v1/dashboard/overview
   * Returns aggregated real-time metrics for Dashboard Cards
   */
  getOverview = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getOverview();
    ApiResponse.success(res, 'Dashboard overview fetched successfully', data);
  });

  /**
   * GET /api/v1/dashboard/revenue
   * Returns monthly revenue trends and breakups
   */
  getRevenueAnalytics = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getRevenueAnalytics();
    ApiResponse.success(res, 'Revenue analytics fetched successfully', data);
  });

  /**
   * GET /api/v1/dashboard/occupancy
   * Returns occupancy breakdown by room type & property
   */
  getOccupancyAnalytics = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getOccupancyAnalytics();
    ApiResponse.success(res, 'Occupancy analytics fetched successfully', data);
  });
}

export const dashboardController = new DashboardController();
