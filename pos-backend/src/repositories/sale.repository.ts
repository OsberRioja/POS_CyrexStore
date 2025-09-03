// src/repositories/sale.repository.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SaleRepository = {
  async create(payload: any) {
    // payload must contain: sellerId, clientId?, total, createdBy?, items[], payments[], cashBoxId?
    return prisma.sale.create({
      data: {
        sellerId: payload.sellerId,
        clientId: payload.clientId ?? undefined,
        total: payload.total,
        createdBy: payload.createdBy ?? undefined,
        cashBoxId: payload.cashBoxId ?? undefined,
        items: { create: payload.items },
        payments: { create: payload.payments },
        // if you have note etc:
        //...(payload.note ? { note: payload.note } : {}),
      },
      include: {
        items: true,
        payments: { include: { paymentMethod: true } },
      },
    });
  },

  async findAll(opts: {
    page?: number;
    limit?: number;
    sellerId?: string;
    sellerUserCode?: number;
    cashBoxId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page = 1, limit = 20, sellerId, cashBoxId, dateFrom, dateTo } = opts;
    const where: any = {};

    if (sellerId) where.sellerId = sellerId;
    if (cashBoxId !== undefined) where.cashBoxId = Number(cashBoxId);
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const skip = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, limit));
    const take = Math.max(1, Math.min(limit, 100));

    const [total, data] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: { items: { include: { product: true } }, payments: { include: { paymentMethod: true } }, /* optionally include client, seller user */ },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return { total, data };
  },

  async findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: { include: { paymentMethod: true } },
      },
    });
  },

  async findByBox(cashBoxId: number) {
    return prisma.sale.findMany({
      where: { cashBoxId: cashBoxId },
      include: {
        items: { include: { product: true } },
        payments: { include: { paymentMethod: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
};
