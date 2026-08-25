import { z } from 'zod';

export const VerifyPGSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }),
});

export const VerifyKYCSchema = z.object({
  body: z.object({
    status: z.enum(['VERIFIED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }),
});

export const SuspendUserSchema = z.object({
  body: z.object({
    isSuspended: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED']).optional(),
    reason: z.string().optional(),
  }),
});

export type VerifyPGDTO = z.infer<typeof VerifyPGSchema>['body'];
export type VerifyKYCDTO = z.infer<typeof VerifyKYCSchema>['body'];
export type SuspendUserDTO = z.infer<typeof SuspendUserSchema>['body'];
