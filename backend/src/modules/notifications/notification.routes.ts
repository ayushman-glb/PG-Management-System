import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.list);
router.put('/:id/read', controller.markRead);

export default router;
