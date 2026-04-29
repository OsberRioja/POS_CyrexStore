"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = exports.addPaymentSchema = void 0;
const zod_1 = require("zod");
// NUEVO: Schema de Zod para validación de pagos adicionales
exports.addPaymentSchema = zod_1.z.object({
    saleId: zod_1.z.string().uuid('ID de venta inválido'),
    paymentMethodId: zod_1.z.number().int().positive('ID de método de pago inválido'),
    amount: zod_1.z.number().positive('El monto debe ser positivo'),
    cashBoxId: zod_1.z.number().int().positive().optional(),
});
// Schema para crear venta (opcional, para validaciones futuras)
exports.createSaleSchema = zod_1.z.object({
    sellerUserCode: zod_1.z.number().int().positive().optional(),
    sellerId: zod_1.z.string().uuid().optional(),
    clientId: zod_1.z.number().int().positive().optional(),
    client: zod_1.z.object({
        id_cliente: zod_1.z.number().int().positive().optional(),
        tipoCliente: zod_1.z.enum(['PERSONA', 'EMPRESA']).optional(),
        nombre: zod_1.z.string().min(1).optional(),
        telefono: zod_1.z.string().optional(),
        countryCode: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        genero: zod_1.z.string().optional(),
        fecha_nacimiento: zod_1.z.string().optional(),
    }).optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid('ID de producto inválido'),
        quantity: zod_1.z.number().int().positive('La cantidad debe ser positiva'),
        unitPrice: zod_1.z.number().positive().optional(),
        serialNumbers: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    })).min(1, 'Debe incluir al menos un producto'),
    payments: zod_1.z.array(zod_1.z.object({
        paymentMethodId: zod_1.z.number().int().positive('ID de método de pago inválido'),
        amount: zod_1.z.number().positive('El monto debe ser positivo'),
    })).min(1, 'Debe incluir al menos un pago'),
    allowPartialPayment: zod_1.z.boolean().optional(),
    note: zod_1.z.string().optional(),
    cashBoxId: zod_1.z.number().int().positive().optional(),
});
