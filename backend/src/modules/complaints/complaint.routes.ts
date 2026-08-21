import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// ── File a complaint (any authenticated user) ─────────────────────────────────
router.post('/',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.complaintController.create(req, res, next));

// ── List complaints (owner/admin sees their PG's complaints) ──────────────────
router.get('/',
  authorize(Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.complaintController.list(req, res, next));

// ── Resolve / reject a complaint (owner/admin only) ───────────────────────────
router.put('/:id/status',
  authorize(Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.complaintController.updateStatus(req, res, next));

router.patch('/:id/status',
  authorize(Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.complaintController.updateStatus(req, res, next));

// ── Send support reply email to ticket creator ─────────────────────────────────
router.post('/send-reply',
  authorize(Role.OWNER, Role.ADMIN, Role.GOD),
  (req, res, next) => Container.complaintController.sendSupportReply(req, res, next));

export default router;
