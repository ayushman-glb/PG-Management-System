import { z } from 'zod';

export const ApplyBookingSchema = z.object({
  body: z.object({
    bedId: z.string().min(1, 'Bed ID is required'),
    expectedCheckIn: z.string().min(1, 'Expected check-in date is required'),
    expectedCheckOut: z.string().optional(),
    monthlyRent: z.number().positive('Monthly rent must be positive'),
    securityDeposit: z.number().positive('Security deposit must be positive'),
    specialRequests: z.string().optional(),
  }),
});

export const AllocateBedSchema = z.object({
  body: z.object({
    allocationNotes: z.string().optional(),
  }),
});

export const CancelBookingSchema = z.object({
  body: z.object({
    cancellationReason: z.string().min(3, 'Cancellation reason required'),
  }),
});

export type ApplyBookingDTO = z.infer<typeof ApplyBookingSchema>['body'];
export type AllocateBedDTO = z.infer<typeof AllocateBedSchema>['body'];
export type CancelBookingDTO = z.infer<typeof CancelBookingSchema>['body'];
