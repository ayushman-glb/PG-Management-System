import { Response } from 'express';
import { IPropertyService } from '../interfaces/services/IPropertyService';
import { catchAsync } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export class PropertyController {
  constructor(private readonly propertyService: IPropertyService) {}

  getPublicProperties = catchAsync(async (req: AuthRequest, res: Response) => {
    const { city, lat, lng, maxDistanceKm, minRent, maxRent, roomType, page, limit } = req.query;

    const result = await this.propertyService.searchPublicProperties({
      city: city as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      maxDistanceKm: maxDistanceKm ? parseFloat(maxDistanceKm as string) : undefined,
      minRent: minRent ? parseFloat(minRent as string) : undefined,
      maxRent: maxRent ? parseFloat(maxRent as string) : undefined,
      roomType: roomType as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    return ApiResponse.success(res, 'Properties retrieved successfully', result);
  });

  getPropertyById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const property = await this.propertyService.getPropertyById(id);
    return ApiResponse.success(res, 'Property details retrieved', property);
  });

  createProperty = catchAsync(async (req: AuthRequest, res: Response) => {
    const ownerId = req.user!.id;
    const property = await this.propertyService.createProperty(ownerId, req.body);
    return ApiResponse.success(res, 'Property created successfully with room matrix', property, 201);
  });

  getOwnerSummary = catchAsync(async (req: AuthRequest, res: Response) => {
    const ownerId = req.user!.id;
    const summary = await this.propertyService.getOwnerSummary(ownerId);
    return ApiResponse.success(res, 'Owner dashboard metrics retrieved', summary);
  });
}
