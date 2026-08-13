import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { SearchService } from './search.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

const searchService = new SearchService(prisma);

export class SearchController {
  search = catchAsync(async (req: Request, res: Response) => {
    const { q, pgId } = req.query;
    const results = await searchService.globalSearch((q as string) || '', pgId as string);
    return ApiResponse.success(res, 'Global search results', results);
  });
}
