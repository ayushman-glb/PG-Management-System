import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/revenue', controller.getRevenue);
router.get('/pg/:pgId', controller.getByPg);

export default router;
