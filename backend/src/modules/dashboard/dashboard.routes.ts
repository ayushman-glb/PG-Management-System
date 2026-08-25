import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { authenticate, requireRole } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.PG_OWNER, Role.ADMIN));

router.get('/overview', dashboardController.getOverview);
router.get('/revenue', dashboardController.getRevenue);
router.get('/occupancy', dashboardController.getOccupancy);

export { router as dashboardRoutes };
