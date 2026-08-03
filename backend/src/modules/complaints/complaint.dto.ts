import { z } from 'zod';

export const CreateComplaintSchema = z.object({
  body: z.object({
    category: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(5),
  })
});
