import { z } from 'zod';

export const RoomTransferRequestSchema = z.object({
  body: z.object({
    residentId: z.string().min(1),
    pgId: z.string().min(1),
    currentBedId: z.string().min(1),
    reason: z.string().min(3),
  })
});
