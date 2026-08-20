import { Router } from 'express';
import { RoomController } from './room.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();
const controller = new RoomController();

router.use(authenticate);

router.put('/:roomId/convert', controller.convertType);
router.get('/pg/:pgId', controller.listByPg);
router.post('/transfer-requests', controller.createTransferRequest);
router.get('/transfer-requests', controller.listTransferRequests);
router.put('/transfer-requests/:id/approve', controller.approveTransfer);
router.put('/transfer-requests/:id/reject', controller.rejectTransfer);
router.post('/transfer-requests/:id/complete', controller.completeTransfer);

export default router;
