import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.dashboardService.getOverview(user.id, user.role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.dashboardService.getRevenue(user.id, user.role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getOccupancy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.dashboardService.getOccupancy(user.id, user.role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
