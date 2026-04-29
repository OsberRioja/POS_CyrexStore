"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/prismaClient.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
});
exports.prisma = prisma;
// middleware para hashear password (User create/update)
// prisma.$use(async (params, next) => {
//   if (params.model === "User" && (params.action === "create" || params.action === "update")) {
//     const data = params.args?.data;
//     if (data && typeof data.password === "string") {
//       const p: string = data.password;
//       if (!p.startsWith("$2a$") && !p.startsWith("$2b$") && !p.startsWith("$2y$")) {
//         data.password = await bcrypt.hash(p, 10);
//         params.args.data = data;
//       }
//     }
//   }
//   return next(params);
// });
