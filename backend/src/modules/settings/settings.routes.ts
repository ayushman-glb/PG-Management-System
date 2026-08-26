import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { ApiResponse } from '../../utils/apiResponse';
import { prisma } from '../../config/prisma';

const router = Router();

router.get('/audit-logs', authenticate, async (req: any, res) => {
  const userId = req.user?.id;
  const logs = (await (prisma as any).activityLog?.findMany?.({
    where: userId ? { userId } : {},
    take: 50,
    orderBy: { createdAt: 'desc' },
  })) || [];

  return ApiResponse.success(res, 'Audit logs retrieved successfully', logs);
});

router.get('/preferences', authenticate, async (req: any, res) => {
  return ApiResponse.success(res, 'Preferences retrieved', {
    emailNotifications: true,
    smsNotifications: true,
    theme: 'dark',
  });
});

export { router as settingsRoutes };
