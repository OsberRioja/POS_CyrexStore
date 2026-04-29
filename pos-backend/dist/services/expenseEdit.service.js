"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseEditService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.ExpenseEditService = {
    async updateExpense(expenseId, dto, actorUserId, branchId) {
        return await prisma.$transaction(async (tx) => {
            // 1. Obtener gasto actual
            const expense = await tx.expense.findUnique({
                where: { id: expenseId },
                include: { cashBox: true }
            });
            if (!expense) {
                throw { status: 404, message: "Gasto no encontrado" };
            }
            // 2. Verificar que la caja está REOPENED
            if (expense.cashBox?.status === "CLOSED") {
                throw {
                    status: 400,
                    message: "Solo se pueden editar gastos en cajas abiertas"
                };
            }
            // 3. Verificar que pertenece a la sucursal
            if (expense.branchId !== branchId) {
                throw {
                    status: 403,
                    message: "El gasto no pertenece a esta sucursal"
                };
            }
            // 4. Actualizar gasto
            const updatedExpense = await tx.expense.update({
                where: { id: expenseId },
                data: {
                    amount: dto.amount,
                    concept: dto.concept,
                    paymentMethodId: dto.paymentMethodId,
                },
                include: {
                    paymentMethod: true,
                    user: {
                        select: {
                            name: true,
                            userCode: true
                        }
                    }
                }
            });
            return updatedExpense;
        });
    }
};
