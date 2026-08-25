import { z } from 'zod';

export const AnalyticsQuerySchema = z.object({
  query: z.object({
    pgId: z.string().optional(),
    timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export type AnalyticsQueryDTO = z.infer<typeof AnalyticsQuerySchema>['query'];
