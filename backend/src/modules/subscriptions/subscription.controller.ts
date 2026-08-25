import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscription.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class SubscriptionController {
  constructor(private readonly subService: SubscriptionService) {}

  listPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.subService.listPlans();
      return ApiResponse.success(res, 'Subscription plans retrieved.', plans);
    } catch (error) {
      next(error);
    }
  };

  getMySubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const sub = await this.subService.getOwnerSubscription(req.user.id);
      return ApiResponse.success(res, 'Active subscription retrieved.', sub);
    } catch (error) {
      next(error);
    }
  };

  checkLimits = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const limits = await this.subService.checkCanCreatePG(req.user.id);
      return ApiResponse.success(res, 'Subscription limits verified.', limits);
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { planId } = req.body;
      if (!planId) throw new BadRequestError('planId is required.');

      const order = await this.subService.createSubscriptionOrder(req.user.id, planId);
      return ApiResponse.success(res, 'Subscription payment order created.', order);
    } catch (error) {
      next(error);
    }
  };

  verifyAndActivate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { subscriptionId, razorpayPaymentId, razorpaySignature } = req.body;
      if (!subscriptionId || !razorpayPaymentId) {
        throw new BadRequestError('subscriptionId and razorpayPaymentId are required.');
      }

      const subscription = await this.subService.verifyAndActivateSubscription(
        req.user.id,
        subscriptionId,
        razorpayPaymentId,
        razorpaySignature
      );

      return ApiResponse.success(res, 'Subscription activated successfully!', subscription);
    } catch (error) {
      next(error);
    }
  };

  cancelSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const result = await this.subService.cancelSubscription(req.user.id);
      return ApiResponse.success(res, 'Subscription cancelled successfully.', result);
    } catch (error) {
      next(error);
    }
  };
}
