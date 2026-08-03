import { z } from 'zod';

export const OnboardResidentSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    propertyId: z.string().min(1),
    bedId: z.string().min(1),
  })
});
