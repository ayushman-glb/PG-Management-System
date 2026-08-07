import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";
import { MoveInService } from "./moveIn.service";
import { prisma } from "../../config/prisma";

const service = new MoveInService(prisma);

export class MoveInController {
  getMoveInInfo = catchAsync(async (req: AuthRequest, res: Response) => {
    const { propertyId } = req.params;
    const info = await service.getMoveInInfo(propertyId);
    return ApiResponse.success(res, "Move-in information retrieved", info);
  });

  upsertMoveInInfo = catchAsync(async (req: AuthRequest, res: Response) => {
    const { propertyId } = req.params;
    const { keyHandoverDetails, houseRules, contactPhone, contactEmail, wifiDetails, gateCode } = req.body;

    if (!keyHandoverDetails || !contactPhone || !contactEmail) {
      return ApiResponse.error(res, "keyHandoverDetails, contactPhone, and contactEmail are required", undefined, 400);
    }

    const info = await service.upsertMoveInInfo(propertyId, {
      keyHandoverDetails,
      houseRules: houseRules || [],
      contactPhone,
      contactEmail,
      wifiDetails,
      gateCode,
    });

    return ApiResponse.success(res, "Move-in information updated", info);
  });

  getTenantDashboardSummary = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const summary = await service.getTenantDashboardSummary(userId);
    return ApiResponse.success(res, "Dashboard summary retrieved", summary);
  });
}
