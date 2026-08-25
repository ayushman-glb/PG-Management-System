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
      const { allocationId, bookingId, requestedDate, plannedMoveOutDate, reason } = req.body;
      const targetId = allocationId || bookingId || 'ACTIVE';
      const moveDate = requestedDate || plannedMoveOutDate || new Date().toISOString();

      const result = await this.moveOutService.requestMoveOut(req.user.id, targetId, moveDate, reason || '');
      return ApiResponse.success(res, 'Move-out request initiated.', result);
    } catch (error) {
      next(error);
    }
  };

  settleCheckout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { allocationId, bookingId, deductions, damageDeduction, unpaidBillsDeduction, otherDeduction, deductionReason } = req.body;
      const targetId = allocationId || bookingId;
      if (!targetId) throw new BadRequestError('allocationId or bookingId is required.');

      const totalDeductions = (deductions || 0) + (damageDeduction || 0) + (unpaidBillsDeduction || 0) + (otherDeduction || 0);

      const result = await this.moveOutService.settleAndReleaseCheckout(req.user.id, targetId, Number(totalDeductions), deductionReason);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  getMoveOutRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pgId } = req.query;
      const data = await this.moveOutService.getMoveOutRequests(pgId as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
