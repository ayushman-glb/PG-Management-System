import { z } from 'zod';

export const ProcessPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    method: z.enum(['UPI', 'CARD', 'CASH', 'BANK_TRANSFER', 'RAZORPAY', 'UPI_MANUAL', 'BANK_TRANSFER_MANUAL']),
    payerId: z.string().min(1, 'Payer ID required'),
    description: z.string().min(3, 'Description required'),
    pgId: z.string().optional(),
    invoiceId: z.string().optional(),
  }),
});

export const VerifyRazorpaySchema = z.object({
  body: z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay Signature is required'),
  }),
});

export const SubmitManualPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.enum(['UPI_MANUAL', 'BANK_TRANSFER_MANUAL', 'CASH']),
    manualUtr: z.string().min(4, 'Valid UTR/Transaction reference required'),
    manualProofUrl: z.string().url('Valid proof URL required').optional(),
  }),
});

export const RefundPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Refund amount must be positive').optional(),
    reason: z.string().min(3, 'Refund reason required (min 3 characters)').optional(),
  }),
});

export type ProcessPaymentDTO = z.infer<typeof ProcessPaymentSchema>['body'];
export type VerifyRazorpayDTO = z.infer<typeof VerifyRazorpaySchema>['body'];
export type SubmitManualPaymentDTO = z.infer<typeof SubmitManualPaymentSchema>['body'];
export type RefundPaymentDTO = z.infer<typeof RefundPaymentSchema>['body'];
