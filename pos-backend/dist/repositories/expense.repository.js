"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseRepository = void 0;
// src/repositories/expense.repository.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.ExpenseRepository = {
    async create(data) {
        return prisma.expense.create({
            data: {
                amount: data.amount,
                concept: data.concept,
                paymentMethodId: data.paymentMethodId,
                cashBoxId: data.cashBoxId ?? undefined,
                createdBy: data.createdBy ?? undefined,
                branchId: data.branchId,
                ...(data.note ? { concept: data.note } : {}), // si quieres guardar note aparte, adapta modelo
            },
            include: {
                paymentMethod: true,
                user: {
                    select: {
                        name: true,
                        userCode: true,
                    }
                },
                branch: { select: { name: true } }
            },
        });
    },
    async findByBox(boxId) {
        return prisma.expense.findMany({
            where: { cashBoxId: boxId },
            include: {
                paymentMethod: true,
                user: {
                    select: {
                        name: true,
                        userCode: true,
                    }
                },
                branch: { select: { name: true } }
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async findAll(branchId) {
        return prisma.expense.findMany({
            where: branchId ? { branchId } : {},
            include: {
                paymentMethod: true,
                user: {
                    select: {
                        name: true,
                        userCode: true,
                    }
                },
                branch: { select: { name: true } }
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async findById(id) {
        return prisma.expense.findUnique({
            where: { id },
            include: {
                paymentMethod: true,
                cashBox: true,
                user: {
                    select: {
                        name: true,
                        userCode: true,
                    }
                },
                branch: { select: { name: true } }
            },
        });
    },
};
