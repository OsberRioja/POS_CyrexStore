// src/repositories/paymentMethod.repository.ts
import { PrismaClient, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

export const PaymentMethodRepository = {
  findAll: async (): Promise<PaymentMethod[]> => {
    return prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
  },

  findById: async (id: number): Promise<PaymentMethod | null> => {
    return prisma.paymentMethod.findUnique({ where: { id } });
  },

  findByName: async (name: string): Promise<PaymentMethod | null> => {
    return prisma.paymentMethod.findUnique({ where: { name } });
  },

  create: async (data: { name: string }): Promise<PaymentMethod> => {
    return prisma.paymentMethod.create({ data });
  },

  update: async (id: number, data: { name?: string }): Promise<PaymentMethod> => {
    return prisma.paymentMethod.update({ where: { id }, data });
  },

  delete: async (id: number): Promise<PaymentMethod> => {
    return prisma.paymentMethod.delete({ where: { id } });
  },

  upsertByName: async (name: string): Promise<PaymentMethod> => {
    // usa upsert para garantizar existencia (name es unique)
    return prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  },
};
