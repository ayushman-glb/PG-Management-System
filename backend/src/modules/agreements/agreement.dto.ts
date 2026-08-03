import { z } from 'zod';

export const SignAgreementSchema = z.object({
  body: z.object({
    signerType: z.enum(['RESIDENT', 'OWNER', 'WITNESS']),
    signerName: z.string().min(2),
    signatureDataSvg: z.string().min(10)
  })
});
