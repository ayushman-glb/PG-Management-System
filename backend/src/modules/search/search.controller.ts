import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';
import { ApiResponse } from '../../utils/apiResponse';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  searchPGs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        query,
        city,
        locality,
        genderType,
        roomType,
        minPrice,
        maxPrice,
        isAc,
        hasFood,
        latitude,
        longitude,
        radiusKm,
        page,
        limit,
      } = req.query;

      const result = await this.searchService.searchPGs({
        query: query as string,
        city: city as string,
        locality: locality as string,
        genderType: genderType as any,
        roomType: roomType as any,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        isAc: isAc === 'true' ? true : undefined,
        hasFood: hasFood === 'true' ? true : undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        radiusKm: radiusKm ? Number(radiusKm) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
      });

      return ApiResponse.success(res, 'PG properties retrieved.', result.pgs, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };
}
