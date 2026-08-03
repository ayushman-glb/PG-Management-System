import { z } from 'zod';

export const LoginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

export const RegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER', 'RESIDENT']).optional(),
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
