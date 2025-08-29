import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const CashBoxRepository = {
  create: (data:any) => prisma.cashBox.create({ data }),
  findOpen: () => prisma.cashBox.findFirst({ where: { status: "OPEN" } } ),
  findById: (id:number) => prisma.cashBox.findUnique({ where: { id }, include: { sales: true, expenses: true } }),
  update: (id:number, data:any) => prisma.cashBox.update({ where:{ id }, data }),
};
