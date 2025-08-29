import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const ExpenseRepository = {
  create: (data:any) => prisma.expense.create({ data }),
  findAllByBox: (boxId:number) => prisma.expense.findMany({ where:{ cashBoxId: boxId } }),
  findAll: () => prisma.expense.findMany(),
};
