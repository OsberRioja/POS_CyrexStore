"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommissionConfigSchema = exports.CommissionConfigSchema = exports.CommissionRangeSchema = void 0;
const zod_1 = require("zod");
// Esquemas para validación con Zod
exports.CommissionRangeSchema = zod_1.z.object({
    minAmount: zod_1.z.number().min(0),
    maxAmount: zod_1.z.number().nullable().optional(), // nullable para indicar "hasta infinito"
    commissionValue: zod_1.z.number().min(0),
    commissionType: zod_1.z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
});
exports.CommissionConfigSchema = zod_1.z.object({
    type: zod_1.z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'TIERED_RANGES']),
    isActive: zod_1.z.boolean().default(false),
    fixedAmount: zod_1.z.number().min(0).optional().nullable(),
    percentage: zod_1.z.number().min(0).max(100).optional().nullable(), // porcentaje entre 0 y 100
    ranges: zod_1.z.array(exports.CommissionRangeSchema).optional(),
});
// DTO para actualizar configuración (todos los campos opcionales)
exports.UpdateCommissionConfigSchema = exports.CommissionConfigSchema.partial();
