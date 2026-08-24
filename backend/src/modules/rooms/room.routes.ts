import { Router } from 'express';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const roomService = new RoomService();
const roomController = new RoomController(roomService);

const router = Router();

router.post('/', authenticate, requireOwner, roomController.createRoom);
router.get('/floor/:floorId', authenticate, roomController.getRoomsByFloor);
router.patch('/:id/status', authenticate, requireOwner, roomController.updateStatus);

export { router as roomRoutes };
