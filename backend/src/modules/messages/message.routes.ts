import { Router } from 'express';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { authenticate } from '../../middleware/authMiddleware';

const messageService = new MessageService();
const messageController = new MessageController(messageService);

const router = Router();

router.use(authenticate);

router.post('/thread', messageController.getOrCreateThread);
router.get('/threads', messageController.getThreads);
router.get('/thread/:id', messageController.getThreadMessages);
router.post('/', messageController.sendMessage);

export { router as messageRoutes };
