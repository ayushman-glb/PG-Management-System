import { z } from 'zod';

export const CreatePropertySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Property name must be at least 3 characters'),
    description: z.string().optional(),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    pincode: z.string().min(6, 'Valid PIN code required'),
    rentStartingFrom: z.number().positive(),
    securityDeposit: z.number().positive(),
    amenities: z.array(z.string()).optional()
  })
});

export const QueryPropertySchema = z.object({
  query: z.object({
    city: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional()
  })
});
