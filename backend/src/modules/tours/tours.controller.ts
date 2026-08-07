import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";
import { ToursService } from "./tours.service";
import { prisma } from "../../config/prisma";

const toursService = new ToursService(prisma);

export class ToursController {
  toggleShortlist = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { propertyId } = req.params;
    const result = await toursService.toggleShortlist(userId, propertyId);
    return ApiResponse.success(res, result.message, result);
  });

  getShortlist = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const items = await toursService.getUserShortlist(userId);
    return ApiResponse.success(res, "Saved properties fetched", items);
  });

  requestTour = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { propertyId, requestedSlot, notes } = req.body;

    if (!propertyId || !requestedSlot) {
      return ApiResponse.error(res, "propertyId and requestedSlot are required", undefined, 400);
    }

    const tour = await toursService.requestTour({
      userId,
      pgId: propertyId,
      requestedSlot,
      notes,
    });
    return ApiResponse.success(res, "Tour requested successfully", tour, undefined, 201);
  });

  getTours = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = { id: req.user!.id, role: req.user!.role };
    const tours = await toursService.listTours(user);
    return ApiResponse.success(res, "Tours retrieved successfully", tours);
  });

  updateTourStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, ownerNotes, requestedSlot } = req.body;

    const tour = await toursService.updateTourStatus(id, {
      status,
      ownerNotes,
      requestedSlot,
    });
    return ApiResponse.success(res, "Tour status updated", tour);
  });
}
