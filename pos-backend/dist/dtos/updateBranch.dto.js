"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBranchSchema = void 0;
const zod_1 = require("zod");
exports.UpdateBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
