import { z } from 'zod';

export const SavePersonalDetailsSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.string().min(5),
    emergencyContact: z.string().min(10),
    bio: z.string().optional()
  })
});

export const SaveBankDetailsSchema = z.object({
  body: z.object({
    bankName: z.string().min(2),
    accountNumber: z.string().min(8),
    ifscCode: z.string().min(4),
    upiId: z.string().min(3)
  })
});
