import { Request, Response } from 'express';
import { IPropertyService } from '../../interfaces/services/IPropertyService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

export class PropertyController {
  constructor(private readonly propertyService: IPropertyService) {}

  searchPublic = catchAsync(async (req: Request, res: Response) => {
    const { city, lat, lng, maxDistanceKm, minRent, maxRent, page, limit } = req.query;

    const result = await this.propertyService.searchPublicProperties({
      city: city as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      maxDistanceKm: maxDistanceKm ? parseFloat(maxDistanceKm as string) : undefined,
      minRent: minRent ? parseFloat(minRent as string) : undefined,
      maxRent: maxRent ? parseFloat(maxRent as string) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    return ApiResponse.success(res, 'Properties retrieved successfully', { properties: result.properties }, result.meta);
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const property = await this.propertyService.getPropertyById(id);
    return ApiResponse.success(res, 'Property details fetched', property);
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const ownerId = (req as any).user?.id || req.body.ownerId || '650000000000000000000001';
    const property = await this.propertyService.createProperty(ownerId, req.body);
    return ApiResponse.success(res, 'Property created successfully with room grid', property, undefined, 201);
  });

  getOwnerSummary = catchAsync(async (req: Request, res: Response) => {
    const ownerId = (req as any).user?.id || req.query.ownerId || '650000000000000000000001';
    const summary = await this.propertyService.getOwnerSummary(ownerId as string);
    return ApiResponse.success(res, 'Owner summary metrics retrieved', summary);
  });
}
