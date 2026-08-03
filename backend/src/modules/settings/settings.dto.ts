import { z } from 'zod';

export const DeleteAccountSchema = z.object({
  body: z.object({
    userId: z.string().min(1)
  })
});
