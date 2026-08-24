import { Request, Response, NextFunction } from 'express';
import { RoomService } from './room.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  createRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { floorId, roomNumber, roomType, allowedGender, baseRent, depositAmount, isAc, hasAttachedBathroom, bedsCount } = req.body;
      if (!floorId || !roomNumber || !roomType || baseRent === undefined) {
        throw new BadRequestError('floorId, roomNumber, roomType, and baseRent are required.');
      }

      const room = await this.roomService.createRoom({
        ownerId: req.user.id,
        floorId,
        roomNumber,
        roomType,
        allowedGender,
        baseRent: Number(baseRent),
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        isAc: Boolean(isAc),
        hasAttachedBathroom: Boolean(hasAttachedBathroom),
        bedsCount: bedsCount ? Number(bedsCount) : undefined,
      });

      return ApiResponse.success(res, 'Room and bed inventory created successfully.', room, 201);
    } catch (error) {
      next(error);
    }
  };

  getRoomsByFloor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { floorId } = req.params;
      const rooms = await this.roomService.getRoomsByFloor(floorId);
      return ApiResponse.success(res, 'Rooms retrieved.', rooms);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { status } = req.body;
      if (!status) throw new BadRequestError('Status is required.');

      const room = await this.roomService.updateRoomStatus(id, req.user.id, status);
      return ApiResponse.success(res, `Room status updated to ${status}`, room);
    } catch (error) {
      next(error);
    }
  };
}
