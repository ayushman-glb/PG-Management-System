import { z } from 'zod';

export const RequestMoveOutSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    plannedMoveOutDate: z.string().min(1, 'Planned move-out date is required'),
    reason: z.string().min(3, 'Reason is required (min 3 characters)'),
    feedback: z.string().optional(),
    bankDetails: z.object({
      accountName: z.string().min(1, 'Account name required'),
      accountNumber: z.string().min(4, 'Account number required'),
      ifscCode: z.string().min(4, 'IFSC code required'),
      upiId: z.string().optional(),
    }).optional(),
  }),
});

export const SettleCheckoutSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    damageDeduction: z.number().nonnegative().optional(),
    unpaidBillsDeduction: z.number().nonnegative().optional(),
    otherDeduction: z.number().nonnegative().optional(),
    deductionReason: z.string().optional(),
  }),
});

export type RequestMoveOutDTO = z.infer<typeof RequestMoveOutSchema>['body'];
export type SettleCheckoutDTO = z.infer<typeof SettleCheckoutSchema>['body'];
