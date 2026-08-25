import { Request, Response, NextFunction } from 'express';
import { ResidentService } from './resident.service';

export class ResidentController {
  constructor(private residentService: ResidentService) {}

  onboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const data = await this.residentService.onboard(userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.residentService.getDirectory(req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getPortalMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const residentId = req.user!.id;
      const data = await this.residentService.getPortalMe(residentId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const data = await this.residentService.updateResidentStatus(id, status, reason);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getStatusHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.residentService.getStatusHistory(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getResidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.residentService.getResidents();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getResidentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.residentService.getResidentById(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createVisitorPass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const residentId = req.user!.id;
      const data = await this.residentService.createVisitorPass(residentId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createGatePass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const residentId = req.user!.id;
      const data = await this.residentService.createGatePass(residentId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
