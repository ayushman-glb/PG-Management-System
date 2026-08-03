import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

const prisma = new PrismaClient();
const analyticsService = new AnalyticsService(prisma);

export class AnalyticsController {
  getByPg = catchAsync(async (req: Request, res: Response) => {
    const { pgId } = req.params;
    const data = await analyticsService.getAnalyticsByPg(pgId);
    return ApiResponse.success(res, 'Analytics fetched', data);
  });

  getRevenue = catchAsync(async (req: Request, res: Response) => {
    const ownerId = (req as any).user?.id || (req.query.ownerId as string) || '650000000000000000000001';
    const data = await analyticsService.getRevenueData(ownerId);
    return ApiResponse.success(res, 'Revenue analytics fetched', data);
  });
}
