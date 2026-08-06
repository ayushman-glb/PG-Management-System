import { Router } from 'express';
import { Container } from '../../container';

const router = Router();

router.get('/public', (req, res, next) => Container.propertyController.searchPublic(req, res, next));
router.get('/owner-summary', (req, res, next) => Container.propertyController.getOwnerSummary(req, res, next));
router.get('/:id', (req, res, next) => Container.propertyController.getById(req, res, next));
router.post('/', (req, res, next) => Container.propertyController.create(req, res, next));

export default router;
