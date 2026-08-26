import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../core/errors/CustomErrors';

export const propertySearchQuerySchema = z.object({
  query: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  locality: z.string().max(100).optional(),
  genderType: z.enum(['BOYS', 'GIRLS', 'CO_LIVING']).optional(),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING', 'CUSTOM']).optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .pipe(z.number().min(0).max(1000000).optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .pipe(z.number().min(0).max(1000000).optional()),
  isAc: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  hasFood: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }),
  latitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(-90).max(90).optional()),
  longitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(-180).max(180).optional()),
  radiusKm: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 15))
    .pipe(z.number().min(0.5).max(100).optional()),
  sortBy: z.enum(['recommended', 'distance', 'price_asc', 'price_desc', 'rating']).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1).optional()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 12))
    .pipe(z.number().min(1).max(50).optional()),
});

export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const result = propertySearchQuerySchema.safeParse(req.query);
  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return next(new BadRequestError(`Invalid search parameters: ${errorMessages}`));
  }
  (req as any).validatedSearchQuery = result.data;
  next();
};
