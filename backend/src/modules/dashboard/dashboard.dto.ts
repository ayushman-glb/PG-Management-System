import { z } from 'zod';

export const DashboardFilterSchema = z.object({
  query: z.object({
    pgId: z.string().optional(),
    period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly').optional(),
  }),
});

export type DashboardFilterDTO = z.infer<typeof DashboardFilterSchema>['query'];
