// src/repositories/cashbox.repository.ts
import { PrismaClient, CashBox } from "@prisma/client";
const prisma = new PrismaClient();

export const CashBoxRepository = {
  create: async (data: {
    openedBy: string;
    initialAmount: number;
    status?: "OPEN" | "CLOSED";
    cashCount?: any;
  }): Promise<CashBox> => {
    return prisma.cashBox.create({
      data: {
        openedBy: data.openedBy,
        initialAmount: data.initialAmount,
        status: data.status ?? "OPEN",
      },
    });
  },

  findOpen: async (): Promise<CashBox | null> => {
    return prisma.cashBox.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });
  },

  findById: async (id: number) => {
    return prisma.cashBox.findUnique({
      where: { id },
      include: {
        // no incluimos sales/expenses por defecto para evitar queries grandes;
        // si quieres, añade include: { sales: true, expenses: true }
      },
    });
  },

  update: async (id: number, data: Partial<any>) => {
    return prisma.cashBox.update({ where: { id }, data });
  },
};
