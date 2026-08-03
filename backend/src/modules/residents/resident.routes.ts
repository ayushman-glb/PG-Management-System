import { Router } from 'express';
import { Container } from '../../container';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.post('/onboard', authenticate, (req, res, next) => Container.residentController.onboard(req, res, next));
router.get('/directory', authenticate, (req, res, next) => Container.residentController.getDirectory(req, res, next));
router.get('/me', authenticate, (req, res, next) => Container.residentController.getPortalMe(req, res, next));
router.get('/portal/me', authenticate, (req, res, next) => Container.residentController.getPortalMe(req, res, next));
router.post('/visitor-pass', authenticate, (req, res, next) => Container.residentController.createVisitorPass(req, res, next));
router.post('/gate-pass', authenticate, (req, res, next) => Container.residentController.createGatePass(req, res, next));
router.post('/meal-skip', authenticate, (req, res, next) => Container.residentController.toggleMealSkip(req, res, next));

export default router;
