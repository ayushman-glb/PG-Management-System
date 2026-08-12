import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// ── Directory / full list: OWNER / ADMIN only ─────────────────────────────────
router.get('/',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getDirectory(req, res, next));

router.get('/directory',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getDirectory(req, res, next));

// ── Self-service resident endpoints ──────────────────────────────────────────
router.get('/profile',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getProfile(req, res, next));

router.get('/me',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getPortalMe(req, res, next));

router.get('/portal/me',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getPortalMe(req, res, next));

router.post('/onboard',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.onboard(req, res, next));

router.post('/visitor-pass',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.createVisitorPass(req, res, next));

router.post('/gate-pass',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.createGatePass(req, res, next));

router.post('/meal-skip',
  authenticate,
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.toggleMealSkip(req, res, next));

// ── Status change (eviction etc.): OWNER / ADMIN only ────────────────────────
router.patch('/:residentId/status',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.updateStatus(req, res, next));

// ── Status history: OWNER / ADMIN only ───────────────────────────────────────
router.get('/:residentId/status-history',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getStatusHistory(req, res, next));

// ── Read resident by ID: OWNER / ADMIN only ───────────────────────────────────
router.get('/:id',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.residentController.getResidentById(req, res, next));

export default router;
