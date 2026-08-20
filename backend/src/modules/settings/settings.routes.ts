import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

router.get('/admin/verification-queue', authorize(Role.SUPER_ADMIN, Role.ADMIN), controller.getVerificationQueue);
router.post('/admin/approve-pg/:pgId', authorize(Role.SUPER_ADMIN, Role.ADMIN), controller.approvePg);
router.post('/account/delete', controller.deleteAccount);
router.get('/audit-logs', authorize(Role.SUPER_ADMIN, Role.ADMIN, Role.OWNER), controller.getAuditLogs);

export default router;
