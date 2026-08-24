import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';

const adminService = new AdminService();
const adminController = new AdminController(adminService);

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.setUserStatus);
router.get('/pgs/queue', adminController.getPGQueue);
router.patch('/pgs/:id/verify', adminController.verifyPG);
router.get('/kyc/queue', adminController.getKYCQueue);
router.patch('/kyc/:id/verify', adminController.verifyKYC);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/deletion-requests', adminController.getDeletionRequests);

export { router as adminRoutes };
