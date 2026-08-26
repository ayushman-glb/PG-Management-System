import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';

const adminService = new AdminService();
const adminController = new AdminController(adminService);

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.setUserStatus);
router.post('/users/:id/status', adminController.setUserStatus);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/suspend', adminController.suspendUser);

router.get('/pgs/queue', adminController.getPGQueue);
router.get('/pgs/pending', adminController.getPGQueue);
router.patch('/pgs/:id/verify', adminController.verifyPG);
router.post('/pgs/:id/verify', adminController.verifyPG);

router.get('/kyc/queue', adminController.getKYCQueue);
router.get('/kyc/pending', adminController.getKYCQueue);
router.patch('/kyc/:id/verify', adminController.verifyKYC);
router.post('/kyc/:id/verify', adminController.verifyKYC);

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/deletion-requests', adminController.getDeletionRequests);

export { router as adminRoutes };
