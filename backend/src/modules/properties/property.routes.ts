import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, authorize, requireKycApproved } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// ── Public Marketplace Endpoints ──────────────────────────────────────────────
router.get('/', (req, res, next) => Container.propertyController.searchPublic(req, res, next));
router.get('/search', (req, res, next) => Container.propertyController.searchPublic(req, res, next));
router.get('/public', (req, res, next) => Container.propertyController.searchPublic(req, res, next));

// ── Owner-Scoped Endpoints (Protected) ───────────────────────────────────────
router.get('/owner-summary',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.propertyController.getOwnerSummary(req, res, next));

router.get('/:id', (req, res, next) => Container.propertyController.getById(req, res, next));

router.get('/:pgId/meal-schedules',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.propertyController.getMealSchedules(req, res, next));

router.post('/',
  authenticate,
  authorize(Role.OWNER),
  requireKycApproved,
  (req, res, next) => Container.propertyController.create(req, res, next));

export default router;
