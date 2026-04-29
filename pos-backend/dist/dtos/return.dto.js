"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReturnDTO = exports.CreateReturnItemDTO = void 0;
const zod_1 = require("zod");
exports.CreateReturnItemDTO = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantityReturned: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().positive(),
    condition: zod_1.z.enum(['NEW', 'USED', 'DAMAGED']).optional().default('NEW'),
});
exports.CreateReturnDTO = zod_1.z.object({
    saleId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(1, "El motivo es requerido"),
    items: zod_1.z.array(exports.CreateReturnItemDTO).min(1, "Debe haber al menos un item a devolver"),
    refundMethod: zod_1.z.enum(['CASH', 'CREDIT_NOTE', 'EXCHANGE']),
    notes: zod_1.z.string().optional(),
});
