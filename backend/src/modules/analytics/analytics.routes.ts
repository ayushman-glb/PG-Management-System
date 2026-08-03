import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();
const controller = new AnalyticsController();

router.get('/revenue', controller.getRevenue);
router.get('/pg/:pgId', controller.getByPg);

export default router;
