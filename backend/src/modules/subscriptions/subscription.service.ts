import { PrismaClient, SubscriptionPlan, Subscription, SubscriptionStatus, SubscriptionTier, PaymentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import * as crypto from 'crypto';
import { env } from '../../config/env';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

export class SubscriptionService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  private get razorpay(): any | null {
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && !env.RAZORPAY_KEY_ID.startsWith('rzp_live_your_key')) {
      return new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return null;
  }

  async listPlans(): Promise<SubscriptionPlan[]> {
    return await this.db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.listPlans();
  }

  async getOwnerSubscription(ownerId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
    return await this.db.subscription.findFirst({
      where: {
        ownerId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOwnerActiveSubscription(ownerId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
    return this.getOwnerSubscription(ownerId);
  }

  async createSubscriptionOrder(ownerId: string, planId: string): Promise<{ orderId: string; amount: number; currency: string; subscriptionId: string; keyId: string }> {
    const plan = await this.db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundError('Selected subscription plan not found or inactive.');

    const owner = await this.db.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.PG_OWNER) throw new ForbiddenError('Only PG Owners can purchase owner subscription plans.');

    const amountInPaise = Math.round(plan.monthlyPrice * 100);
    let razorpayOrderId = `sub_order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (this.razorpay) {
      try {
        const order = await this.razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `sub_${ownerId.slice(-6)}_${Date.now().toString().slice(-4)}`,
          notes: {
            ownerId,
            planId,
            tier: plan.tier,
          },
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        console.warn('Razorpay order creation fallback in dev mode:', err?.message || err);
      }
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day billing cycle

    const subscription = await this.db.subscription.create({
      data: {
        ownerId,
        planId: plan.id,
        status: SubscriptionStatus.PAST_DUE,
        currentPeriodStart,
        currentPeriodEnd,
        autoRenew: true,
        razorpaySubscriptionId: razorpayOrderId,
      },
    });

    await this.db.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        ownerId,
        amount: plan.monthlyPrice,
        currency: 'INR',
        razorpayOrderId,
        status: PaymentStatus.INITIATED,
      },
    });

    return {
      orderId: razorpayOrderId,
      amount: plan.monthlyPrice,
      currency: 'INR',
      subscriptionId: subscription.id,
      keyId: env.RAZORPAY_KEY_ID || '',
    };
  }

  async verifyAndActivateSubscription(ownerId: string, subscriptionId: string, razorpayPaymentId: string, razorpaySignature?: string): Promise<Subscription> {
    const subscription = await this.db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) throw new NotFoundError('Subscription not found.');
    if (subscription.ownerId !== ownerId) throw new ForbiddenError('You are not authorized to verify this subscription.');

    const payment = await this.db.subscriptionPayment.findFirst({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) throw new NotFoundError('Payment transaction record not found.');

    if (env.RAZORPAY_KEY_SECRET && razorpaySignature && payment.razorpayOrderId && !env.RAZORPAY_KEY_SECRET.includes('your_')) {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        await this.db.subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        throw new BadRequestError('Razorpay payment signature verification failed.');
      }
    }

    await this.db.subscription.updateMany({
      where: {
        ownerId,
        status: SubscriptionStatus.ACTIVE,
        id: { not: subscriptionId },
      },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    return await this.db.$transaction(async (tx) => {
      await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.VERIFIED,
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      return await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
        include: { plan: true },
      });
    });
  }

  async verifyPGLimit(ownerId: string): Promise<void> {
    await this.checkCanCreatePG(ownerId);
  }

  async checkCanCreatePG(ownerId: string): Promise<{ canCreate: boolean; currentCount: number; maxAllowed: number; tierName: string }> {
    const activeSub = await this.getOwnerSubscription(ownerId);
    if (!activeSub) {
      throw new ForbiddenError('You do not have an active subscription. Please subscribe to a plan to list properties.');
    }

    const currentCount = await this.db.pG.count({ where: { ownerId } });
    const maxAllowed = activeSub.plan.pgLimit;

    if (currentCount >= maxAllowed) {
      throw new ForbiddenError(
        `Subscription plan limit reached. Your ${activeSub.plan.name} plan allows a maximum of ${maxAllowed} PGs (currently ${currentCount}). Please upgrade to add more properties.`
      );
    }

    return {
      canCreate: true,
      currentCount,
      maxAllowed,
      tierName: activeSub.plan.name,
    };
  }
}
