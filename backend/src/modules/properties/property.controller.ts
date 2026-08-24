import { Request, Response, NextFunction } from 'express';
import { PropertyService } from './property.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  createPG = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const pg = await this.propertyService.createPG({
        ...req.body,
        ownerId: req.user.id,
      });
      return ApiResponse.success(res, 'PG listing submitted for admin verification.', pg, 201);
    } catch (error) {
      next(error);
    }
  };

  getOwnerPGs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const pgs = await this.propertyService.getOwnerPGs(req.user.id);
      return ApiResponse.success(res, 'Owner PGs retrieved.', pgs);
    } catch (error) {
      next(error);
    }
  };

  getPGDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const pg = await this.propertyService.getPGDetails(id, req.user?.id, req.user?.role);
      return ApiResponse.success(res, 'PG details retrieved.', pg);
    } catch (error) {
      next(error);
    }
  };

  addFloor = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { floorNumber, floorName, wifiSsid, wifiPassword } = req.body;
      if (floorNumber === undefined || !floorName) {
        throw new BadRequestError('floorNumber and floorName are required.');
      }

      const floor = await this.propertyService.addFloor(id, req.user.id, Number(floorNumber), floorName, wifiSsid, wifiPassword);
      return ApiResponse.success(res, 'Floor created successfully.', floor, 201);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, adminNotes } = req.body;
      if (!status) throw new BadRequestError('Status is required.');

      const pg = await this.propertyService.updatePGStatus(id, status, rejectionReason, adminNotes);
      return ApiResponse.success(res, `PG status updated to ${status}`, pg);
    } catch (error) {
      next(error);
    }
  };
}
