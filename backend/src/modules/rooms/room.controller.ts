import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { RoomService } from './room.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

const roomService = new RoomService(prisma);

export class RoomController {
  convertType = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { newType } = req.body;
    const result = await roomService.convertRoomType(roomId, newType);
    return ApiResponse.success(res, 'Room type converted successfully', { success: result });
  });

  listByPg = catchAsync(async (req: Request, res: Response) => {
    const { pgId } = req.params;
    const rooms = await roomService.getRoomsByPg(pgId);
    return ApiResponse.success(res, 'Rooms retrieved', rooms);
  });

  createTransferRequest = catchAsync(async (req: Request, res: Response) => {
    const request = await roomService.createRoomTransferRequest(req.body);
    return ApiResponse.success(res, 'Room transfer request submitted', request, undefined, 201);
  });

  listTransferRequests = catchAsync(async (req: Request, res: Response) => {
    const { pgId, residentId } = req.query;
    const requests = await roomService.getRoomTransferRequests(pgId as string, residentId as string);
    return ApiResponse.success(res, 'Transfer requests retrieved', requests);
  });

  approveTransfer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetBedId, scheduledDate } = req.body;
    const result = await roomService.approveRoomTransfer(id, targetBedId, scheduledDate);
    return ApiResponse.success(res, 'Transfer request approved', result);
  });

  rejectTransfer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const result = await roomService.rejectRoomTransfer(id, rejectionReason);
    return ApiResponse.success(res, 'Transfer request rejected', result);
  });

  completeTransfer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await roomService.completeRoomTransfer(id);
    return ApiResponse.success(res, 'Transfer completed successfully', result);
  });
}
