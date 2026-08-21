import { Router } from 'express';
import { GodService } from './god.service';
import { GodController } from './god.controller';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();
const godService = new GodService();
const godController = new GodController(godService);

// ── Strict Security Guard: GOD Role Only ───────────────────────────────────────
// Non-GOD (e.g. RESIDENT, OWNER, MANAGER) requests return 403 FORBIDDEN.
router.use(authenticate);
router.use(authorize(Role.GOD));

router.get('/overview', godController.getOverview);
router.get('/owners', godController.getOwners);
router.get('/owners/:id', godController.getOwnerById);
router.get('/residents', godController.getResidents);
router.get('/revenue', godController.getRevenueAnalytics);

export default router;
