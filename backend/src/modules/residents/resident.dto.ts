import { z } from 'zod';

export const ResidentOnboardSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    phoneNumber: z.string().min(10, 'Valid 10-digit phone number is required'),
    roomNumber: z.string().min(1, 'Room number is required'),
    bedNumber: z.string().min(1, 'Bed number is required'),
    checkInDate: z.string().min(1, 'Check-in date is required'),
    monthlyRent: z.number().positive('Monthly rent must be positive'),
    securityDeposit: z.number().positive('Security deposit must be positive'),
    emergencyContact: z.string().optional(),
    guardianName: z.string().optional(),
    aadhaarNumber: z.string().optional(),
    panNumber: z.string().optional(),
  }),
});

export const CreateVisitorPassSchema = z.object({
  body: z.object({
    visitorName: z.string().min(2, 'Visitor name is required'),
    visitorPhone: z.string().min(10, 'Valid visitor phone number is required'),
    purpose: z.string().min(3, 'Purpose is required'),
    expectedArrival: z.string().min(1, 'Expected arrival time is required'),
    expectedDeparture: z.string().optional(),
  }),
});

export const CreateGatePassSchema = z.object({
  body: z.object({
    destination: z.string().min(2, 'Destination is required'),
    reason: z.string().min(3, 'Reason is required'),
    departureDate: z.string().min(1, 'Departure date is required'),
    returnDate: z.string().min(1, 'Expected return date is required'),
    emergencyContact: z.string().optional(),
  }),
});

export type ResidentOnboardDTO = z.infer<typeof ResidentOnboardSchema>['body'];
export type CreateVisitorPassDTO = z.infer<typeof CreateVisitorPassSchema>['body'];
export type CreateGatePassDTO = z.infer<typeof CreateGatePassSchema>['body'];
