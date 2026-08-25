import { z } from 'zod';

export const UpdateOwnerBankDetailsSchema = z.object({
  body: z.object({
    accountName: z.string().min(2, 'Account name is required'),
    accountNumber: z.string().min(6, 'Valid account number is required'),
    ifscCode: z.string().min(4, 'Valid IFSC code is required'),
    upiId: z.string().optional(),
    bankName: z.string().optional(),
  }),
});

export type UpdateOwnerBankDetailsDTO = z.infer<typeof UpdateOwnerBankDetailsSchema>['body'];
