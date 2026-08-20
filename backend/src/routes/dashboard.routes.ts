import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/overview', (req, res, next) => dashboardController.getOverview(req, res, next));
router.get('/revenue', (req, res, next) => dashboardController.getRevenueAnalytics(req, res, next));
router.get('/occupancy', (req, res, next) => dashboardController.getOccupancyAnalytics(req, res, next));

export const dashboardRoutes = router;
