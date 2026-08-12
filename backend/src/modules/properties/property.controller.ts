import { Request, Response } from 'express';
import { IPropertyService } from '../../interfaces/services/IPropertyService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { Container } from '../../container';

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
    const user = (req as any).user;
    if (!user || !user.id) {
      return ApiResponse.error(res, 'Unauthorized', [], 401);
    }
    let owner = await Container.db.owner.findFirst({ where: { userId: user.id } });
    if (!owner) {
      owner = await Container.db.owner.create({
        data: {
          userId: user.id,
          name: user.name || "Owner",
          email: user.email,
          phone: user.phone || "",
          photo: user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          address: "",
          aadhaarNumber: "",
          panNumber: "",
          upiId: "",
          bankName: "",
          accountNumber: "",
          ifscCode: "",
          emergencyContact: "",
        },
      });
    }
    const property = await this.propertyService.createProperty(owner.id, req.body);
    return ApiResponse.success(res, 'Property created successfully with room grid', property, undefined, 201);
  });

  getOwnerSummary = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user || !user.id) {
      return ApiResponse.error(res, 'Unauthorized', [], 401);
    }
    const owner = await Container.db.owner.findFirst({ where: { userId: user.id } });
    if (!owner) {
      return ApiResponse.success(res, 'Owner summary fetched', {
        totalProperties: 0,
        mrr: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        occupancyRatePercent: 0,
        activeComplaints: 0,
        pendingDuesAmount: 0,
      });
    }
    const summary = await this.propertyService.getOwnerSummary(owner.id);
    return ApiResponse.success(res, 'Owner summary fetched', summary);
  });

  getMealSchedules = catchAsync(async (req: Request, res: Response) => {
    const pgId = req.params.pgId || (req.query.pgId as string);
    const schedules = await (this.propertyService as any).db?.mealSchedule.findMany({ where: { pgId } }) || [];
    return ApiResponse.success(res, 'Meal schedules retrieved', schedules);
  });
}
