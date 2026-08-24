import { Request, Response, NextFunction } from 'express';
import { BedService } from './bed.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class BedController {
  constructor(private readonly bedService: BedService) {}

  createBed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { roomId, bedNumber, baseRent, depositAmount } = req.body;
      if (!roomId || !bedNumber) throw new BadRequestError('roomId and bedNumber are required.');

      const bed = await this.bedService.createBed(req.user.id, roomId, bedNumber, baseRent, depositAmount);
      return ApiResponse.success(res, 'Bed created successfully.', bed, 201);
    } catch (error) {
      next(error);
    }
  };

  getBedsByRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      const beds = await this.bedService.getBedsByRoom(roomId);
      return ApiResponse.success(res, 'Beds retrieved.', beds);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { status } = req.body;
      if (!status) throw new BadRequestError('status is required.');

      const bed = await this.bedService.updateBedStatus(id, req.user.id, status);
      return ApiResponse.success(res, `Bed status updated to ${status}`, bed);
    } catch (error) {
      next(error);
    }
  };
}
