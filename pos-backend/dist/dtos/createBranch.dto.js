"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBranchSchema = void 0;
const zod_1 = require("zod");
exports.CreateBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "El nombre es requerido"),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
