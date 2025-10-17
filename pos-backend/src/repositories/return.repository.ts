import { PrismaClient, ReturnStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const ReturnRepository = {
  async create(data: {
    saleId: string;
    reason: string;
    approvedBy: string;
    totalRefunded: number;
    refundMethod: string;
    notes?: string;
    status?: ReturnStatus;
    items: Array<{
      productId: string;
      quantityReturned: number;
      unitPrice: number;
      subtotal: number;
      condition?: string;
    }>;
  }) {
    return prisma.return.create({
      data: {
        saleId: data.saleId,
        reason: data.reason,
        approvedBy: data.approvedBy,
        totalRefunded: data.totalRefunded,
        refundMethod: data.refundMethod,
        notes: data.notes,
        status: data.status || ReturnStatus.PENDING,
        items: {
          create: data.items,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        sale: {
          include: {
            client: true,
            seller: {
              select: {
                name: true,
                userCode: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            userCode: true,
          },
        },
      },
    });
  },

  async findById(id: number) {
    return prisma.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        sale: {
          include: {
            client: true,
            seller: {
              select: {
                name: true,
                userCode: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            userCode: true,
          },
        },
      },
    });
  },

  async list(params: { page?: number; limit?: number; saleId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where = params.saleId ? { saleId: params.saleId } : {};

    const [total, data] = await Promise.all([
      prisma.return.count({ where }),
      prisma.return.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
          sale: {
            include: {
              client: true,
              seller: {
                select: {
                  name: true,
                  userCode: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              userCode: true,
            },
          },
        },
        orderBy: { returnDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, data };
  },
};