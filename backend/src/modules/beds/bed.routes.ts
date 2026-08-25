import { Router } from 'express';
import { BedController } from './bed.controller';
import { BedService } from './bed.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const bedService = new BedService();
const bedController = new BedController(bedService);

const router = Router();

router.use(authenticate);

// Bed Holds
router.post('/holds', bedController.createHold);
router.delete('/holds/:id', bedController.releaseHold);
router.get('/holds', bedController.getHolds);

// Bed Management
router.post('/', requireOwner, bedController.createBed);
router.get('/room/:roomId', bedController.getBedsByRoom);
router.patch('/:id/status', bedController.updateStatus);
router.put('/:id/status', bedController.updateStatus);

export { router as bedRoutes };
