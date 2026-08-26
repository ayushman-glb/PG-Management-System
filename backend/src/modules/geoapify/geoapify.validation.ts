import { z } from 'zod';

export const autocompleteQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query must be at least 1 character')
    .max(100, 'Search query cannot exceed 100 characters'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 8))
    .pipe(z.number().min(1).max(20)),
  bias: z.string().optional(),
});

export const geocodeQuerySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Address text must be at least 1 character')
    .max(200, 'Address text cannot exceed 200 characters'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5))
    .pipe(z.number().min(1).max(10)),
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(-90).max(90)),
  lon: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(-180).max(180)),
});
