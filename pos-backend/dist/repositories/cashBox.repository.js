"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashBoxRepository = void 0;
// src/repositories/cashbox.repository.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.CashBoxRepository = {
    create: async (data) => {
        return prisma.cashBox.create({
            data: {
                openedBy: data.openedBy,
                initialAmount: data.initialAmount,
                status: data.status ?? "OPEN",
                branchId: data.branchId,
            },
        });
    },
    findOpen: async () => {
        return prisma.cashBox.findFirst({
            where: { status: "OPEN" },
            orderBy: { openedAt: "desc" },
        });
    },
    findOpenByBranch: async (branchId) => {
        return prisma.cashBox.findFirst({
            where: {
                OR: [
                    { status: "OPEN", branchId },
                    { status: "REOPENED", branchId }
                ]
            },
            orderBy: { openedAt: "desc" },
        });
    },
    findById: async (id) => {
        return prisma.cashBox.findUnique({
            where: { id },
            include: {
                // no incluimos sales/expenses por defecto para evitar queries grandes;
                // si quieres, añade include: { sales: true, expenses: true }
                branch: { select: { name: true } },
            },
        });
    },
    update: async (id, data) => {
        return prisma.cashBox.update({ where: { id }, data });
    },
    findMany: async (options) => {
        return prisma.cashBox.findMany({
            where: options.where,
            skip: options.skip,
            take: options.take,
            orderBy: { openedAt: "desc" },
            include: {
                openedByUser: {
                    select: { name: true, userCode: true }
                },
                closedByUser: {
                    select: { name: true, userCode: true }
                }
            }
        });
    },
    count: async (where) => {
        return prisma.cashBox.count({ where });
    },
    list: async () => {
        return prisma.cashBox.findMany({
            orderBy: { openedAt: "desc" },
        });
    },
};
