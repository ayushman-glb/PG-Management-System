import { Response, NextFunction } from 'express';
import { TourService } from './tours.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class TourController {
  constructor(private readonly tourService: TourService) {}

  requestTour = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const tour = await this.tourService.requestTour(req.user.id, req.body);
      return ApiResponse.success(res, 'Tour visit requested successfully.', tour, 201);
    } catch (error) {
      next(error);
    }
  };

  getTours = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const tours = await this.tourService.getTours(req.user.id, req.user.role);
      return ApiResponse.success(res, 'Tours retrieved successfully.', tours);
    } catch (error) {
      next(error);
    }
  };

  updateTourStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const updated = await this.tourService.updateTourStatus(id, req.user.id, req.user.role, req.body);
      return ApiResponse.success(res, `Tour status updated to ${updated.status}.`, updated);
    } catch (error) {
      next(error);
    }
  };
}
