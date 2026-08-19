import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService = new DashboardService()) {}

  /**
   * GET /api/v1/dashboard/overview
   * Returns aggregated real-time metrics for Dashboard Cards
   */
  getOverview = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.dashboardService.getOverview();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error fetching dashboard overview:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/dashboard/revenue
   * Returns monthly revenue trends and breakups
   */
  getRevenueAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.dashboardService.getRevenueAnalytics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/dashboard/occupancy
   * Returns occupancy breakdown by room type & property
   */
  getOccupancyAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.dashboardService.getOccupancyAnalytics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}

export const dashboardController = new DashboardController();
