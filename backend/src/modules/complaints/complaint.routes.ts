import { Router } from 'express';
import { Container } from '../../container';
import { authenticate } from '../../middleware/authMiddleware';
import { verifyRecaptcha } from '../../middleware/recaptcha.middleware';

const router = Router();

router.use(authenticate);

router.post('/', verifyRecaptcha('complaint'), (req, res, next) => Container.complaintController.create(req, res, next));
router.get('/', (req, res, next) => Container.complaintController.list(req, res, next));
router.put('/:id/status', (req, res, next) => Container.complaintController.updateStatus(req, res, next));
router.patch('/:id/status', (req, res, next) => Container.complaintController.updateStatus(req, res, next));

export default router;
