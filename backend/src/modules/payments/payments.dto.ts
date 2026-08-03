import { z } from 'zod';

export const ProcessPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    method: z.enum(['UPI', 'CARD', 'CASH', 'BANK_TRANSFER']),
    payerId: z.string().min(1, 'Payer ID required'),
    description: z.string().min(3, 'Description required')
  })
});
