import { Router } from 'express';
import { MoveInController } from './moveIn.controller';
import { MoveOutService } from './moveIn.service';
import { authenticate, requireOwner, requireResident } from '../../middleware/authMiddleware';

const moveOutService = new MoveOutService();
const moveInController = new MoveInController(moveOutService);

const router = Router();

router.use(authenticate);

router.post('/checkout-request', requireResident, moveInController.requestMoveOut);
router.post('/request-move-out', requireResident, moveInController.requestMoveOut);
router.post('/checkout-settle', requireOwner, moveInController.settleCheckout);
router.post('/process-settlement', requireOwner, moveInController.settleCheckout);
router.get('/move-out-requests', requireOwner, moveInController.getMoveOutRequests);

export { router as moveInRoutes };
