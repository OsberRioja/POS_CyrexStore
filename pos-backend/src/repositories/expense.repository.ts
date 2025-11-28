// src/repositories/expense.repository.ts
import { PrismaClient, Expense } from "@prisma/client";

const prisma = new PrismaClient();

export const ExpenseRepository = {
  async create(data: {
    amount: number;
    concept: string;
    paymentMethodId: number;
    cashBoxId?: number | null;
    createdBy?: string | null;
    branchId: number;
    note?: string | null;
  }): Promise<Expense> {
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
        branch: {select: { name: true } }
      },
    });
  },

  async findByBox(boxId: number) {
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
        branch: {select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findAll(branchId?: number) {
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
        branch: {select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: number) {
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
        branch: {select: { name: true } }
      },
    });
  },
};
