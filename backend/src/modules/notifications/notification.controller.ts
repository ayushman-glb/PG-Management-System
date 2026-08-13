import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { NotificationService } from './notification.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

const notificationService = new NotificationService(prisma);

export class NotificationController {
  list = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req.query.userId as string) || '650000000000000000000001';
    const notifications = await notificationService.getUserNotifications(userId);
    return ApiResponse.success(res, 'Notifications retrieved', notifications);
  });

  markRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await notificationService.markAsRead(id);
    return ApiResponse.success(res, 'Notification marked as read');
  });
}
