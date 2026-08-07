import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SettingsService } from './settings.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

const prisma = new PrismaClient();
const settingsService = new SettingsService(prisma);

export class SettingsController {
  getVerificationQueue = catchAsync(async (req: Request, res: Response) => {
    const queue = await settingsService.getAdminVerificationQueue();
    return ApiResponse.success(res, 'Verification queue fetched', queue);
  });

  approvePg = catchAsync(async (req: Request, res: Response) => {
    const { pgId } = req.params;
    const pg = await settingsService.approvePgProperty(pgId);
    return ApiResponse.success(res, 'PG property approved', pg);
  });

  deleteAccount = catchAsync(async (req: Request, res: Response) => {
    const { userId, reason } = req.body;
    await settingsService.softDeleteAccount(userId, reason, req.ip, req.get('user-agent'));
    return ApiResponse.success(res, 'Account soft-deleted');
  });

  getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' }
    });
    return ApiResponse.success(res, 'Audit logs retrieved', logs);
  });
}
