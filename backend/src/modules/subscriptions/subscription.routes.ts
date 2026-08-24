import { Router } from 'express';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const subService = new SubscriptionService();
const subController = new SubscriptionController(subService);

const router = Router();

router.get('/plans', subController.listPlans);
router.get('/my-subscription', authenticate, requireOwner, subController.getMySubscription);
router.get('/current', authenticate, requireOwner, subController.getMySubscription);
router.post('/create-order', authenticate, requireOwner, subController.createOrder);
router.post('/verify', authenticate, requireOwner, subController.verifyAndActivate);

export { router as subscriptionRoutes };
