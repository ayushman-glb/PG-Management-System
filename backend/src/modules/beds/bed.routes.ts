import { Router } from 'express';
import { BedController } from './bed.controller';
import { BedService } from './bed.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const bedService = new BedService();
const bedController = new BedController(bedService);

const router = Router();

router.post('/', authenticate, requireOwner, bedController.createBed);
router.get('/room/:roomId', authenticate, bedController.getBedsByRoom);
router.patch('/:id/status', authenticate, requireOwner, bedController.updateStatus);

export { router as bedRoutes };
