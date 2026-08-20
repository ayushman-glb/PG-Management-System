import { Router } from 'express';
import { BedController } from './bed.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();
const controller = new BedController();

router.use(authenticate);

router.put('/:bedId/status', controller.updateStatus);
router.post('/holds', controller.createHold);
router.delete('/holds/:holdId', controller.releaseHold);
router.get('/holds', controller.listHolds);

export default router;
