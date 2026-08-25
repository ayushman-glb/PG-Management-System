import { z } from 'zod';

export const CreateSubscriptionOrderSchema = z.object({
  body: z.object({
    tier: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
    billingCycle: z.enum(['MONTHLY', 'ANNUAL']).default('MONTHLY'),
  }),
});

export const VerifySubscriptionPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
    tier: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
  }),
});

export type CreateSubscriptionOrderDTO = z.infer<typeof CreateSubscriptionOrderSchema>['body'];
export type VerifySubscriptionPaymentDTO = z.infer<typeof VerifySubscriptionPaymentSchema>['body'];
