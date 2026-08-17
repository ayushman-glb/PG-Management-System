import { Response } from 'express';
import { marketingService } from './marketing.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';

export class MarketingController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    const campaign = await marketingService.createCampaign(req.body);
    return ApiResponse.success(res, 'Marketing campaign created', campaign, undefined, 201);
  });

  send = catchAsync(async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.body;
    let targetId = campaignId;

    // If payload contains campaign details directly, create and immediately send
    if (!targetId && req.body.title && req.body.content) {
      const created = await marketingService.createCampaign(req.body);
      targetId = created.id;
    }

    const result = await marketingService.sendCampaign(targetId);
    return ApiResponse.success(res, result.message, result);
  });

  list = catchAsync(async (req: AuthRequest, res: Response) => {
    const campaigns = await marketingService.listCampaigns();
    return ApiResponse.success(res, 'Marketing campaigns retrieved', campaigns);
  });

  preview = catchAsync(async (req: AuthRequest, res: Response) => {
    const preview = await marketingService.previewTemplate(req.body);
    return ApiResponse.success(res, 'Campaign preview generated', preview);
  });
}

export const marketingController = new MarketingController();
export default marketingController;
