import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { authenticate, requireOwner, requireAdmin } from '../../middleware/authMiddleware';

const analyticsService = new AnalyticsService();
const analyticsController = new AnalyticsController(analyticsService);

const router = Router();

router.get('/owner', authenticate, requireOwner, analyticsController.getOwnerAnalytics);
router.get('/revenue', authenticate, requireOwner, analyticsController.getRevenueAnalytics);
router.get('/occupancy', authenticate, requireOwner, analyticsController.getOccupancyAnalytics);
router.get('/pl', authenticate, requireOwner, analyticsController.getProfitLossAnalytics);
router.get('/admin', authenticate, requireAdmin, analyticsController.getAdminAnalytics);

export { router as analyticsRoutes };
