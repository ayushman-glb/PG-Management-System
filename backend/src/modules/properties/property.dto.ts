import { z } from 'zod';

export const CreatePropertySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Property name is required (min 2 characters)'),
    description: z.string().optional(),
    address: z.string().min(5, 'Address is required (min 5 characters)'),
    city: z.string().min(2, 'City is required'),
    state: z.string().optional(),
    pincode: z.string().min(6, 'Valid PIN code required (min 6 characters)'),
    rentStartingFrom: z.number().positive().optional(),
    securityDeposit: z.number().positive().optional(),
    totalRooms: z.number().int().min(1).optional(),
    totalBeds: z.number().int().min(1).optional(),
    amenities: z.array(z.string()).optional(),
  }),
});

export const QueryPropertySchema = z.object({
  query: z.object({
    city: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreatePropertyDTO = z.infer<typeof CreatePropertySchema>['body'];
export type QueryPropertyDTO = z.infer<typeof QueryPropertySchema>['query'];
