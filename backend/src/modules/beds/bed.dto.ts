import { z } from 'zod';

export const CreateBedHoldSchema = z.object({
  body: z.object({
    bedId: z.string().min(1),
    reason: z.string().min(1)
  })
});
