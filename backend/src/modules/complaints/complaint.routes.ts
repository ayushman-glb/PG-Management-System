import { Router } from 'express';
import { Container } from '../../container';

const router = Router();

router.post('/', (req, res, next) => Container.complaintController.create(req, res, next));
router.get('/', (req, res, next) => Container.complaintController.list(req, res, next));
router.put('/:id/status', (req, res, next) => Container.complaintController.updateStatus(req, res, next));
router.patch('/:id/status', (req, res, next) => Container.complaintController.updateStatus(req, res, next));

export default router;
