import { Router } from 'express';
import { ResidentController } from './resident.controller';
import { ResidentService } from './resident.service';
import { authenticate } from '../../middleware/authMiddleware';

const residentService = new ResidentService();
const residentController = new ResidentController(residentService);

const router = Router();

router.use(authenticate);

router.post('/onboard', residentController.onboard);
router.get('/directory', residentController.getDirectory);
router.get('/portal/me', residentController.getPortalMe);
router.post('/portal/visitor-pass', residentController.createVisitorPass);
router.post('/portal/gate-pass', residentController.createGatePass);
router.patch('/:id/status', residentController.updateStatus);
router.get('/:id/status-history', residentController.getStatusHistory);
router.get('/:id', residentController.getResidentById);
router.get('/', residentController.getResidents);

export { router as residentRoutes };
