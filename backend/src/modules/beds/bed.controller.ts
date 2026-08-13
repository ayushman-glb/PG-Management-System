import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { BedService } from './bed.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

const bedService = new BedService(prisma);

export class BedController {
  updateStatus = catchAsync(async (req: Request, res: Response) => {
    const { bedId } = req.params;
    const { status, notes } = req.body;
    const result = await bedService.updateBedStatus(bedId, status, notes);
    return ApiResponse.success(res, 'Bed status updated', { success: result });
  });

  createHold = catchAsync(async (req: Request, res: Response) => {
    const hold = await bedService.createBedHold(req.body);
    return ApiResponse.success(res, 'Bed hold created successfully', hold, undefined, 201);
  });

  releaseHold = catchAsync(async (req: Request, res: Response) => {
    const { holdId } = req.params;
    const result = await bedService.releaseBedHold(holdId);
    return ApiResponse.success(res, 'Bed hold released', { success: result });
  });

  listHolds = catchAsync(async (req: Request, res: Response) => {
    const { pgId } = req.query;
    const holds = await bedService.getBedHolds(pgId as string);
    return ApiResponse.success(res, 'Bed holds retrieved', holds);
  });
}
