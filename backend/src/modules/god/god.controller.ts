import { Response } from 'express';
import { GodService } from './god.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';

export class GodController {
  constructor(private readonly godService: GodService) {}

  getOverview = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = await this.godService.getOverview();
    return ApiResponse.success(res, 'Platform GOD analytics overview retrieved', data);
  });

  getOwners = catchAsync(async (req: AuthRequest, res: Response) => {
    const { page, limit, search, city, kycStatus } = req.query;
    const result = await this.godService.getOwners({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
      city: city as string,
      kycStatus: kycStatus as string,
    });
    return ApiResponse.success(res, 'PG Owners directory retrieved', result.owners, result.pagination);
  });

  getOwnerById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await this.godService.getOwnerById(id);
    return ApiResponse.success(res, 'Owner detail profile and properties retrieved', result);
  });

  getResidents = catchAsync(async (req: AuthRequest, res: Response) => {
    const { page, limit, search, status, pgId, ownerId } = req.query;
    const result = await this.godService.getResidents({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
      status: status as string,
      pgId: pgId as string,
      ownerId: ownerId as string,
    });
    return ApiResponse.success(res, 'Platform-wide residents directory retrieved', result.residents, result.pagination);
  });

  getRevenueAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    const { timeframe } = req.query;
    const result = await this.godService.getRevenueAnalytics((timeframe as any) || 'monthly');
    return ApiResponse.success(res, 'Platform revenue and subscription analytics retrieved', result);
  });
}
