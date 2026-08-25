import { Router } from 'express';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { authenticate, requireRole } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const ownerService = new OwnerService();
const ownerController = new OwnerController(ownerService);

const router = Router();

router.use(authenticate);

router.post('/onboard', ownerController.submitOnboarding);
router.get('/verifications', requireRole(Role.ADMIN), ownerController.getPendingVerifications);
router.get('/:id/status', ownerController.getOnboardingStatus);

export { router as ownerRoutes };
