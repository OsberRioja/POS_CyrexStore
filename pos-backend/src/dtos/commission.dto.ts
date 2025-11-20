import { z } from 'zod';

// Esquemas para validación con Zod
export const CommissionRangeSchema = z.object({
  minAmount: z.number().min(0),
  maxAmount: z.number().nullable().optional(), // nullable para indicar "hasta infinito"
  commissionValue: z.number().min(0),
  commissionType: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
});

export const CommissionConfigSchema = z.object({
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'TIERED_RANGES']),
  isActive: z.boolean().default(false),
  fixedAmount: z.number().min(0).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(), // porcentaje entre 0 y 100
  ranges: z.array(CommissionRangeSchema).optional(),
});

// Tipos TypeScript inferidos de los esquemas
export type CommissionRangeDTO = z.infer<typeof CommissionRangeSchema>;
export type CommissionConfigDTO = z.infer<typeof CommissionConfigSchema>;

// DTO para actualizar configuración (todos los campos opcionales)
export const UpdateCommissionConfigSchema = CommissionConfigSchema.partial();
export type UpdateCommissionConfigDTO = z.infer<typeof UpdateCommissionConfigSchema>;