import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";
import { ApplicationsService } from "./applications.service";
import { prisma } from "../../config/prisma";

const service = new ApplicationsService(prisma);

export class ApplicationsController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { pgId, roomId, bedId, moveInDate, monthlyRent, securityDeposit, notes } = req.body;

    if (!pgId || !moveInDate || !monthlyRent) {
      return ApiResponse.error(res, "pgId, moveInDate, and monthlyRent are required", undefined, 400);
    }

    const application = await service.createApplication({
      userId,
      pgId,
      roomId,
      bedId,
      moveInDate,
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : monthlyRent,
      notes,
    });

    return ApiResponse.success(res, "Application submitted successfully", application, undefined, 201);
  });

  uploadDocument = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { docType, fileName, fileUrl } = req.body;

    if (!docType || !fileUrl) {
      return ApiResponse.error(res, "docType and fileUrl are required", undefined, 400);
    }

    const doc = await service.addDocument(id, {
      docType,
      fileName: fileName || "document.pdf",
      fileUrl,
    });
    return ApiResponse.success(res, "Document uploaded and linked to application", doc, undefined, 201);
  });

  getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = { id: req.user!.id, role: req.user!.role };
    const application = await service.getApplicationById(id, user);
    return ApiResponse.success(res, "Application retrieved", application);
  });

  list = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = { id: req.user!.id, role: req.user!.role };
    const applications = await service.listApplications(user);
    return ApiResponse.success(res, "Applications retrieved", applications);
  });

  updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status) {
      return ApiResponse.error(res, "status is required", undefined, 400);
    }

    const application = await service.updateStatus(id, status, rejectionReason);
    return ApiResponse.success(res, "Application status updated", application);
  });

  signLease = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { signerName, signerEmail, signatureDataSvg } = req.body;
    const ipAddress = req.ip || "unknown";

    if (!signerName || !signerEmail) {
      return ApiResponse.error(res, "signerName and signerEmail are required", undefined, 400);
    }

    const result = await service.signLease(id, signerName, signerEmail, ipAddress, signatureDataSvg);
    return ApiResponse.success(res, "Lease agreement successfully signed", result);
  });
}
