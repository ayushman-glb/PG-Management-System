import { Router } from 'express';
import { MoveInController } from './moveIn.controller';
import { MoveOutService } from './moveIn.service';
import { authenticate, requireOwner, requireResident } from '../../middleware/authMiddleware';

const moveOutService = new MoveOutService();
const moveInController = new MoveInController(moveOutService);

const router = Router();

router.post('/checkout-request', authenticate, requireResident, moveInController.requestMoveOut);
router.post('/checkout-settle', authenticate, requireOwner, moveInController.settleCheckout);

export { router as moveInRoutes };
