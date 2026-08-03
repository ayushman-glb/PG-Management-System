import { z } from 'zod';

export const CreatePropertySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    pincode: z.string().min(6, 'Pincode is required'),
    totalRooms: z.number().int().min(1),
    totalBeds: z.number().int().min(1),
  })
});
