import { Router } from 'express';
import { Container } from '../container';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';
import { logAudit } from '../middleware/auditLogger';

const router = Router();
const { residentController } = Container;

router.post('/onboard', logAudit('RESIDENT_ONBOARD_KYC'), residentController.onboard);
router.get('/directory', authenticate, authorize(Role.OWNER, Role.ADMIN), residentController.getDirectory);
router.get('/portal/me', authenticate, authorize(Role.RESIDENT, Role.ADMIN), residentController.getPortalMe);
router.post('/portal/visitor-pass', authenticate, authorize(Role.RESIDENT, Role.ADMIN), logAudit('CREATE_VISITOR_PASS'), residentController.createVisitorPass);
router.post('/portal/gate-pass', authenticate, authorize(Role.RESIDENT, Role.ADMIN), logAudit('CREATE_GATE_PASS'), residentController.createGatePass);
router.post('/portal/meal-skip', authenticate, authorize(Role.RESIDENT, Role.ADMIN), residentController.toggleMealSkip);

export default router;
