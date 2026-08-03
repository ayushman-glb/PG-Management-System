import { Response } from 'express';
import { IResidentService } from '../interfaces/services/IResidentService';
import { catchAsync } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export class ResidentController {
  constructor(private readonly residentService: IResidentService) {}

  onboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const result = await this.residentService.onboardResident({ ...req.body, userId });
    return ApiResponse.success(res, 'KYC onboarding successfully submitted', result, 201);
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
    const userId = req.user!.id;
    const data = await this.residentService.getPortalData(userId);
    return ApiResponse.success(res, 'Resident portal data fetched', data);
  });

  createVisitorPass = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const pass = await this.residentService.createVisitorPass(userId, req.body);
    return ApiResponse.success(res, 'Visitor pass created successfully with QR code', pass, 201);
  });

  createGatePass = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const pass = await this.residentService.createGatePass(userId, req.body);
    return ApiResponse.success(res, 'Gate pass submitted successfully', pass, 201);
  });

  toggleMealSkip = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { date, mealType } = req.body;
    const result = await this.residentService.toggleMealSkip(userId, date, mealType);
    return ApiResponse.success(res, result.message, result);
  });
}
