import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ExpenseEditService = {
    async updateExpense(
        expenseId: number,
        dto: {
            amount: number;
            concept: string;
            paymentMethodId: number;
        },
        actorUserId: string,
        branchId: number
    ) {
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