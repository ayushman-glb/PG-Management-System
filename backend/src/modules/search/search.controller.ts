import { Request, Response, NextFunction } from 'express';
import { SearchService, searchService } from './search.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ISearchFilterDTO } from './search.dto';

export class SearchController {
  constructor(private readonly service: SearchService = searchService) {}

  searchPGs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: ISearchFilterDTO = (req as any).validatedSearchQuery || req.query;
      const result = await this.service.searchPGs(filters);

      return ApiResponse.success(res, 'PG properties retrieved successfully.', result.pgs, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        searchCenter: result.searchCenter,
      });
    } catch (error) {
      next(error);
    }
  };

  getAutocomplete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q || req.query.query || req.query.text || '') as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
      const bias = req.query.bias as string | undefined;

      const suggestions = await this.service.getAutocomplete(q, limit, bias);
      return ApiResponse.success(res, 'Location suggestions retrieved successfully.', suggestions);
    } catch (error) {
      next(error);
    }
  };

  geocode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const text = (req.query.text || req.query.q || req.query.address || '') as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

      const locations = await this.service.geocode(text, limit);
      return ApiResponse.success(res, 'Geocoding results retrieved successfully.', locations);
    } catch (error) {
      next(error);
    }
  };

  reverseGeocode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat((req.query.lon || req.query.lng) as string);

      if (isNaN(lat) || isNaN(lon)) {
        return ApiResponse.error(res, 'Valid lat and lon query parameters are required.', [], 400, 'INVALID_COORDINATES');
      }

      const location = await this.service.reverseGeocode(lat, lon);
      return ApiResponse.success(res, 'Reverse geocoding result retrieved successfully.', location);
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featured = await this.service.getFeatured();
      return ApiResponse.success(res, 'Featured properties retrieved successfully.', featured);
    } catch (error) {
      next(error);
    }
  };
}

export const searchController = new SearchController();
