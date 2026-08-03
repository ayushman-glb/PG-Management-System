import { z } from 'zod';

export const CreatePaymentOrderSchema = z.object({
  body: z.object({
    residentId: z.string().min(1),
    baseAmount: z.number().positive()
  })
});
