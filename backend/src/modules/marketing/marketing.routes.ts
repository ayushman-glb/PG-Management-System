import { Router } from 'express';
import { marketingController } from './marketing.controller';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.SUPER_ADMIN, Role.OWNER));

router.post('/', (req, res, next) => marketingController.create(req, res, next));
router.post('/send', (req, res, next) => marketingController.send(req, res, next));
router.post('/preview', (req, res, next) => marketingController.preview(req, res, next));
router.get('/', (req, res, next) => marketingController.list(req, res, next));
router.get('/campaigns', (req, res, next) => marketingController.list(req, res, next));

export default router;
