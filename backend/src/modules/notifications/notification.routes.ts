import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const notifService = new NotificationService();
const notifController = new NotificationController(notifService);

const router = Router();

router.get('/', authenticate, notifController.getMyNotifications);
router.patch('/:id/read', authenticate, notifController.markAsRead);
router.patch('/read-all', authenticate, notifController.markAllAsRead);
router.post('/read-all', authenticate, notifController.markAllAsRead);
router.patch('/mark-all-read', authenticate, notifController.markAllAsRead);
router.post('/mark-all-read', authenticate, notifController.markAllAsRead);
router.post('/announcement', authenticate, requireOwner, notifController.broadcastAnnouncement);
router.post('/announcements', authenticate, requireOwner, notifController.broadcastAnnouncement);

export { router as notificationRoutes };
