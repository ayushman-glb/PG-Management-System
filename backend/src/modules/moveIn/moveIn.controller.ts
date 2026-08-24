import { Request, Response, NextFunction } from 'express';
import { MoveOutService } from './moveIn.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class MoveInController {
  constructor(private readonly moveOutService: MoveOutService) {}

  requestMoveOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { allocationId, requestedDate, reason } = req.body;
      if (!allocationId || !requestedDate) throw new BadRequestError('allocationId and requestedDate are required.');

      const result = await this.moveOutService.requestMoveOut(req.user.id, allocationId, requestedDate, reason || '');
      return ApiResponse.success(res, 'Move-out request initiated.', result);
    } catch (error) {
      next(error);
    }
  };

  settleCheckout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { allocationId, deductions, deductionReason } = req.body;
      if (!allocationId) throw new BadRequestError('allocationId is required.');

      const result = await this.moveOutService.settleAndReleaseCheckout(req.user.id, allocationId, deductions ? Number(deductions) : 0, deductionReason);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };
}
