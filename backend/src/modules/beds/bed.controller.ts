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
      if (!roomId || !bedNumber) {
        throw new BadRequestError('roomId and bedNumber are required.');
      }

      const bed = await this.bedService.createBed(
        req.user.id,
        roomId,
        bedNumber,
        baseRent ? Number(baseRent) : undefined,
        depositAmount ? Number(depositAmount) : undefined
      );

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

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      if (!status) throw new BadRequestError('Status is required.');

      const bed = await this.bedService.updateBedStatus(id, status, remarks);
      res.json({ success: true, data: bed });
    } catch (error) {
      next(error);
    }
  };

  createHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.bedService.createBedHold(req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  releaseHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.bedService.releaseBedHold(id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getHolds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pgId } = req.query;
      const data = await this.bedService.getBedHolds(pgId as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
