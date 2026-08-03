import { Router } from 'express';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

router.get('/admin/verification-queue', controller.getVerificationQueue);
router.post('/admin/approve-pg/:pgId', controller.approvePg);
router.post('/account/delete', controller.deleteAccount);

export default router;
