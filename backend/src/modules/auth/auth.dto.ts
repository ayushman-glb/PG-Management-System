import { z } from 'zod';

export const LoginSchema = z.object({
  body: z.object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    residentCode: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
    visitorId: z.string().optional(),
    deviceLabel: z.string().optional(),
  }).passthrough().refine((data) => !!(data.identifier || data.email || data.phone || data.residentCode), {
    message: 'Identifier (email/phone/residentCode) is required',
    path: ['identifier'],
  }),
});

export const RegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['PG_OWNER', 'OWNER', 'RESIDENT']).optional(),
    phone: z.string().min(10, 'Valid phone number required').optional()
  })
});

export const SendPhoneOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Valid phone number required')
  })
});

export const VerifyPhoneOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone is required'),
    otp: z.string().length(6, 'OTP must be 6 digits')
  })
});

export const Enable2FASchema = z.object({
  body: z.object({
    userId: z.string().optional()
  })
});
