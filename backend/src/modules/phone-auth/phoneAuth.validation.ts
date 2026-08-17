import { z } from 'zod';

export const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
export const e164Regex = /^\+[1-9]\d{1,14}$/;

export const normalizeIndianPhone = (rawPhone: string): string => {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (rawPhone.startsWith('+')) {
    return `+${digits}`;
  }
  return `+91${digits.slice(-10)}`;
};

export const SendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .refine((val) => {
      const clean = val.replace(/[\s\-]/g, '');
      return phoneRegex.test(clean) || e164Regex.test(clean);
    }, 'Please provide a valid 10-digit Indian mobile number (+91... or 10 digits starting with 6-9)'),
  purpose: z.string().optional().default('PHONE_VERIFICATION'),
});

export const VerifyPhoneOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .refine((val) => {
      const clean = val.replace(/[\s\-]/g, '');
      return phoneRegex.test(clean) || e164Regex.test(clean);
    }, 'Please provide a valid phone number'),
  otp: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
  purpose: z.string().optional().default('PHONE_VERIFICATION'),
});

export const ResendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .refine((val) => {
      const clean = val.replace(/[\s\-]/g, '');
      return phoneRegex.test(clean) || e164Regex.test(clean);
    }, 'Please provide a valid phone number'),
});

export const PhoneStatusSchema = z.object({
  phone: z
    .string()
    .optional(),
});
