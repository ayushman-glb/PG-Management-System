import { Router } from 'express';
import { Container } from '../container';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All resident management endpoints require authentication
router.use(authenticate);

// Resident Status Endpoints
router.post('/status', (req, res) => Container.residentManagementController.updateResidentStatus(req, res));
router.get('/status/history/:residentId', (req, res) => Container.residentManagementController.getResidentStatusHistory(req, res));

// Bed Status & Hold Endpoints
router.post('/beds/status', (req, res) => Container.residentManagementController.updateBedStatus(req, res));
router.post('/beds/hold', (req, res) => Container.residentManagementController.createBedHold(req, res));
router.delete('/beds/hold/:holdId', (req, res) => Container.residentManagementController.releaseBedHold(req, res));
router.get('/beds/holds', (req, res) => Container.residentManagementController.getBedHolds(req, res));

// Room Transfer Request Endpoints
router.post('/transfers/request', (req, res) => Container.residentManagementController.createRoomTransferRequest(req, res));
router.get('/transfers', (req, res) => Container.residentManagementController.getRoomTransferRequests(req, res));
router.post('/transfers/:requestId/approve', (req, res) => Container.residentManagementController.approveRoomTransferRequest(req, res));
router.post('/transfers/:requestId/reject', (req, res) => Container.residentManagementController.rejectRoomTransferRequest(req, res));
router.post('/transfers/:requestId/complete', (req, res) => Container.residentManagementController.completeRoomTransfer(req, res));

// Room Conversion, Audit Logs & Notifications
router.post('/rooms/convert', (req, res) => Container.residentManagementController.convertRoomType(req, res));
router.get('/audit-logs', (req, res) => Container.residentManagementController.getAuditLogs(req, res));
router.get('/notifications', (req, res) => Container.residentManagementController.getNotifications(req, res));

export default router;
