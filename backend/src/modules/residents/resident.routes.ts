import { Router } from 'express';
import { Container } from '../../container';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, (req, res, next) => Container.residentController.getDirectory(req, res, next));
router.get('/directory', authenticate, (req, res, next) => Container.residentController.getDirectory(req, res, next));
router.get('/profile', authenticate, (req, res, next) => Container.residentController.getProfile(req, res, next));
router.get('/me', authenticate, (req, res, next) => Container.residentController.getPortalMe(req, res, next));
router.get('/portal/me', authenticate, (req, res, next) => Container.residentController.getPortalMe(req, res, next));
router.post('/onboard', authenticate, (req, res, next) => Container.residentController.onboard(req, res, next));
router.post('/visitor-pass', authenticate, (req, res, next) => Container.residentController.createVisitorPass(req, res, next));
router.post('/gate-pass', authenticate, (req, res, next) => Container.residentController.createGatePass(req, res, next));
router.post('/meal-skip', authenticate, (req, res, next) => Container.residentController.toggleMealSkip(req, res, next));
router.patch('/:residentId/status', authenticate, (req, res, next) => Container.residentController.updateStatus(req, res, next));
router.get('/:residentId/status-history', authenticate, (req, res, next) => Container.residentController.getStatusHistory(req, res, next));
router.get('/:id', authenticate, (req, res, next) => Container.residentController.getResidentById(req, res, next));

export default router;
