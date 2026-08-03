import { Router } from 'express';
import { NotificationController } from './notification.controller';

const router = Router();
const controller = new NotificationController();

router.get('/', controller.list);
router.put('/:id/read', controller.markRead);

export default router;
