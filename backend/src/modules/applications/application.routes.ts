import { Router } from 'express';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { authenticate } from '../../middleware/authMiddleware';

const applicationService = new ApplicationService();
const applicationController = new ApplicationController(applicationService);

const router = Router();

router.use(authenticate);

router.post('/', applicationController.createApplication);
router.get('/', applicationController.getApplications);
router.get('/:id', applicationController.getApplicationById);
router.patch('/:id/status', applicationController.updateApplicationStatus);
router.post('/:id/documents', applicationController.uploadDocument);
router.post('/:id/sign-lease', applicationController.signLease);

export { router as applicationRoutes };
