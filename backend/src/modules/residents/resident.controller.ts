import { Response } from 'express';
import { IResidentService } from '../../interfaces/services/IResidentService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Container } from '../../container';

export class ResidentController {
  constructor(private readonly residentService: IResidentService) {}

  onboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const result = await this.residentService.onboardResident({ ...req.body, userId });
    return ApiResponse.success(res, 'KYC onboarding successfully submitted', result, undefined, 201);
  });

  getDirectory = catchAsync(async (req: AuthRequest, res: Response) => {
    const { propertyId, search, status } = req.query;
    const residents = await this.residentService.getDirectory({
      propertyId: propertyId as string,
      search: search as string,
      status: status as string
    });
    return ApiResponse.success(res, 'Resident directory fetched', residents);
  });

  getPortalMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const data = await this.residentService.getPortalData(userId);
    return ApiResponse.success(res, 'Resident portal data fetched', data);
  });

  createVisitorPass = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const pass = await this.residentService.createVisitorPass(userId, req.body);
    return ApiResponse.success(res, 'Visitor pass created successfully with QR code', pass, undefined, 201);
  });

  createGatePass = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const pass = await this.residentService.createGatePass(userId, req.body);
    return ApiResponse.success(res, 'Gate pass submitted successfully', pass, undefined, 201);
  });

  toggleMealSkip = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const { date, mealType } = req.body;
    const result = await this.residentService.toggleMealSkip(userId, date, mealType);
    return ApiResponse.success(res, result.message, result);
  });

  getResidentById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const resident = await Container.db.resident.findUnique({ where: { id } });
    if (!resident) {
      return ApiResponse.error(res, 'Resident not found', undefined, 404);
    }
    return ApiResponse.success(res, 'Resident retrieved', resident);
  });

  updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId } = req.params;
    const { status, reason } = req.body;
    if (!residentId || !status) {
      return ApiResponse.error(res, 'Resident ID and status are required', undefined, 400);
    }
    const existing = await Container.db.resident.findUnique({ where: { id: residentId } });
    if (!existing) {
      return ApiResponse.error(res, 'Resident record not found', undefined, 404);
    }
    const updated = await Container.db.resident.update({
      where: { id: residentId },
      data: { status: status as any }
    });
    await Container.db.residentStatusHistory.create({
      data: {
        residentId,
        status: status as any,
        reason,
        updatedBy: req.user?.id || 'system'
      }
    });
    return ApiResponse.success(res, 'Resident status updated', updated);
  });

  getStatusHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId } = req.params;
    const history = await Container.db.residentStatusHistory.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }
    });
    return ApiResponse.success(res, 'Resident status history retrieved', history);
  });

  getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || (req as any).user?.userId || req.params.userId;
    const resident = await Container.db.resident.findUnique({
      where: { userId },
      include: { pg: true, bed: true }
    });
    if (!resident) {
      return ApiResponse.error(res, 'Resident profile not found', undefined, 404);
    }
    return ApiResponse.success(res, 'Resident profile retrieved', resident);
  });
}
