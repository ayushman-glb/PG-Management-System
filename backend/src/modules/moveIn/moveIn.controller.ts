import { Request, Response, NextFunction } from 'express';
import { MoveInService } from './moveIn.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class MoveInController {
  constructor(private readonly moveInService: MoveInService) {}

  getTenantDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const data = await this.moveInService.getTenantDashboardSummary(req.user.id);
      return ApiResponse.success(res, 'Tenant move-in dashboard summary retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getMoveInInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId || req.params.pgId;
      if (!propertyId) throw new BadRequestError('Property ID is required.');
      const data = await this.moveInService.getMoveInInfo(propertyId);
      return ApiResponse.success(res, 'Property move-in info retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  requestMoveOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { allocationId, bookingId, requestedDate, plannedMoveOutDate, reason } = req.body;
      const targetId = allocationId || bookingId || 'ACTIVE';
      const moveDate = requestedDate || plannedMoveOutDate || new Date().toISOString();

      const result = await this.moveInService.requestMoveOut(req.user.id, targetId, moveDate, reason || '');
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

      const result = await this.moveInService.settleAndReleaseCheckout(req.user.id, targetId, Number(totalDeductions), deductionReason);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  getMoveOutRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const data = await this.moveInService.getMoveOutRequests(req.user.id, pgId as string);
      return ApiResponse.success(res, 'Move out requests retrieved.', data);
    } catch (error) {
      next(error);
    }
  };
}
