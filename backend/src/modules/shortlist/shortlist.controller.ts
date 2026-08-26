import { Response, NextFunction } from 'express';
import { ShortlistService } from './shortlist.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class ShortlistController {
  constructor(private readonly shortlistService: ShortlistService) {}

  getShortlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const data = await this.shortlistService.getShortlist(req.user.id);
      return ApiResponse.success(res, 'Shortlist retrieved successfully.', data);
    } catch (error) {
      next(error);
    }
  };

  toggleShortlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const pgId = req.params.propertyId || req.params.pgId || req.body.pgId || req.body.propertyId;
      const data = await this.shortlistService.toggleShortlist(req.user.id, pgId);
      return ApiResponse.success(res, data.message, data);
    } catch (error) {
      next(error);
    }
  };

  removeFromShortlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const pgId = req.params.propertyId || req.params.pgId || req.body.pgId || req.body.propertyId;
      const data = await this.shortlistService.removeFromShortlist(req.user.id, pgId);
      return ApiResponse.success(res, data.message, data);
    } catch (error) {
      next(error);
    }
  };

  syncShortlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgIds } = req.body;
      const data = await this.shortlistService.syncShortlist(req.user.id, pgIds || []);
      return ApiResponse.success(res, `Successfully synchronized ${data.syncedCount} shortlist items.`, data);
    } catch (error) {
      next(error);
    }
  };
}
