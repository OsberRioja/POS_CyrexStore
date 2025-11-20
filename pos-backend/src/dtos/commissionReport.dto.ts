import { z } from 'zod';

export const CommissionReportQuerySchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(50),
});

export const UserCommissionReportQuerySchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CommissionReportQueryDTO = z.infer<typeof CommissionReportQuerySchema>;
export type UserCommissionReportQueryDTO = z.infer<typeof UserCommissionReportQuerySchema>;