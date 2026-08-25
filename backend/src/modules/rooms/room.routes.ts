import { Router } from 'express';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const roomService = new RoomService();
const roomController = new RoomController(roomService);

const router = Router();

router.use(authenticate);

// Room Transfer Requests
router.post('/transfer-requests', roomController.createTransferRequest);
router.get('/transfer-requests', roomController.getTransferRequests);
router.put('/transfer-requests/:id/approve', requireOwner, roomController.approveTransferRequest);
router.put('/transfer-requests/:id/reject', requireOwner, roomController.rejectTransferRequest);
router.post('/transfer-requests/:id/complete', requireOwner, roomController.completeTransferRequest);

// Room Management
router.post('/', requireOwner, roomController.createRoom);
router.get('/floor/:floorId', roomController.getRoomsByFloor);
router.patch('/:id/status', requireOwner, roomController.updateStatus);

export { router as roomRoutes };
