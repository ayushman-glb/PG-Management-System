import { Request, Response, NextFunction } from 'express';
import { OwnerService } from './owner.service';

export class OwnerController {
  constructor(private ownerService: OwnerService) {}

  submitOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = req.user!.id;
      const data = await this.ownerService.submitOnboarding(ownerId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.ownerService.getOnboardingStatus(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ownerService.getPendingVerifications();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
