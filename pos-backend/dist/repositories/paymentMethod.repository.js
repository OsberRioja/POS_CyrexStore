"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodRepository = void 0;
// src/repositories/paymentMethod.repository.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.PaymentMethodRepository = {
    findAll: async () => {
        return prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
    },
    async findById(id) {
        // Validación defensiva: lanzar error si id es inválido
        console.log("getById called with id=", id);
        if (id === undefined || id === null)
            throw new Error("findById: id es requerido");
        const nid = Number(id);
        if (Number.isNaN(nid))
            throw new Error("findById: id inválido");
        return prisma.paymentMethod.findUnique({ where: { id: nid } });
    },
    findByName: async (name) => {
        return prisma.paymentMethod.findUnique({ where: { name } });
    },
    create: async (data) => {
        return prisma.paymentMethod.create({ data: {
                name: data.name,
                isCash: data.iscash ?? false
            }
        });
    },
    update: async (id, data) => {
        return prisma.paymentMethod.update({ where: { id }, data });
    },
    delete: async (id) => {
        return prisma.paymentMethod.delete({ where: { id } });
    },
    upsertByName: async (name, isCash) => {
        // usa upsert para garantizar existencia (name es unique)
        return prisma.paymentMethod.upsert({
            where: { name },
            update: {},
            create: { name, isCash },
        });
    },
    summaryByCashBox: async (cashBoxId) => {
        // 1) todos los métodos
        const methods = await prisma.paymentMethod.findMany();
        // 2) agrupar sumas por paymentMethodId donde la venta pertenece a la cashbox
        // Nota: usa relacion sale en salePayment (salePayment.sale -> sale.cashBoxId)
        const groups = await prisma.salePayment.groupBy({
            by: ["paymentMethodId"],
            where: {
                sale: { cashBoxId }, // filtra payments de ventas cuyo sale.cashBoxId === cashBoxId
            },
            _sum: {
                amount: true,
            },
        });
        const sumsMap = {};
        for (const g of groups) {
            sumsMap[g.paymentMethodId] = Number(g._sum.amount ?? 0);
        }
        // Opcional: sumar gastos por metodo (si quieres restarlos o mostrarlos separados).
        // const expenseGroups = await prisma.expense.groupBy({ by: ["paymentMethodId"], where: { cashBoxId }, _sum: { amount: true }});
        return methods.map((m) => ({
            id: m.id,
            name: m.name,
            isCash: !!m.isCash,
            total: sumsMap[m.id] ?? 0,
        }));
    },
};
