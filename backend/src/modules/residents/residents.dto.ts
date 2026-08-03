import { z } from 'zod';

export const CreateResidentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email required'),
    phone: z.string().min(10, 'Valid phone required'),
    pgId: z.string().min(1, 'PG reference ID is required'),
    bedId: z.string().min(1, 'Bed assignment ID is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    age: z.number().int().min(18, 'Must be at least 18 years old')
  })
});

export const ChangeResidentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'NOTICE_PERIOD', 'VACATED', 'SUSPENDED']),
    reason: z.string().optional()
  })
});
