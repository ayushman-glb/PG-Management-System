import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const data = await this.notifService.getUserNotifications(req.user.id);
      return ApiResponse.success(res, 'Notifications retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const notif = await this.notifService.markAsRead(id, req.user.id);
      return ApiResponse.success(res, 'Notification marked as read.', notif);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      await this.notifService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, 'All notifications marked as read.');
    } catch (error) {
      next(error);
    }
  };

  broadcastAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId, floorId, roomId, residentId, title, message } = req.body;
      if (!pgId || !title || !message) {
        throw new BadRequestError('pgId, title, and message are required.');
      }

      const result = await this.notifService.broadcastAnnouncement({
        ownerId: req.user.id,
        pgId,
        floorId,
        roomId,
        residentId,
        title,
        message,
      });

      return ApiResponse.success(res, `Announcement broadcast to ${result.targetCount} residents.`, result, 201);
    } catch (error) {
      next(error);
    }
  };
}
