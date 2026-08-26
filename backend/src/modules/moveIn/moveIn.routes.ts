import { Router } from 'express';
import { MoveInController } from './moveIn.controller';
import { MoveInService } from './moveIn.service';
import { authenticate, requireOwner, requireResident } from '../../middleware/authMiddleware';

const moveInService = new MoveInService();
const moveInController = new MoveInController(moveInService);

const router = Router();

router.use(authenticate);

router.get('/tenant-summary', requireResident, moveInController.getTenantDashboardSummary);
router.get('/:propertyId', moveInController.getMoveInInfo);
router.post('/checkout-request', requireResident, moveInController.requestMoveOut);
router.post('/request-move-out', requireResident, moveInController.requestMoveOut);
router.post('/checkout-settle', requireOwner, moveInController.settleCheckout);
router.post('/process-settlement', requireOwner, moveInController.settleCheckout);
router.get('/move-out-requests', requireOwner, moveInController.getMoveOutRequests);

export { router as moveInRoutes };
