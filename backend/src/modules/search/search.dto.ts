import { z } from 'zod';

export const GlobalSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1)
  })
});
