"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCommissionReportQuerySchema = exports.CommissionReportQuerySchema = void 0;
const zod_1 = require("zod");
exports.CommissionReportQuerySchema = zod_1.z.object({
    month: zod_1.z.number().min(1).max(12),
    year: zod_1.z.number().min(2000).max(2100),
    page: zod_1.z.number().min(1).optional().default(1),
    limit: zod_1.z.number().min(1).max(100).optional().default(50),
});
exports.UserCommissionReportQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
