import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/overview', (req, res) => dashboardController.getOverview(req, res));
router.get('/revenue', (req, res) => dashboardController.getRevenueAnalytics(req, res));
router.get('/occupancy', (req, res) => dashboardController.getOccupancyAnalytics(req, res));

export const dashboardRoutes = router;
