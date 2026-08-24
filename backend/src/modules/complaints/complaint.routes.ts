import { Router } from 'express';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';
import { authenticate } from '../../middleware/authMiddleware';

const complaintService = new ComplaintService();
const complaintController = new ComplaintController(complaintService);

const router = Router();

router.post('/', authenticate, complaintController.create);
router.get('/', authenticate, complaintController.list);
router.patch('/:id/status', authenticate, complaintController.updateStatus);
router.patch('/:id/acknowledge-resolution', authenticate, complaintController.acknowledgeResolution);
router.post('/:id/messages', authenticate, complaintController.addMessage);

export { router as complaintRoutes };
