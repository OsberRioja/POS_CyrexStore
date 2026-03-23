import { PrismaClient, MovementType } from "@prisma/client";

const prisma = new PrismaClient();

export const StockMovementRepository = {
  create: async (data: {
    productId: string;
    movementType: MovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    unitCost?: number;
    providerId?: number;
    saleId?: string;
    notes?: string;
    reason?: string;
    serialNumbers?: string[];
    createdBy: string;
  }) => {
    return prisma.stockMovement.create({
      data,
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        provider: {
          select: { id_provider: true, name: true }
        },
        user: {
          select: { id: true, name: true, userCode: true }
        }
      }
    });
  },

  findAll: async (filters: {
    productId?: string;
    movementType?: MovementType;
    dateFrom?: Date;
    dateTo?: Date;
    skip?: number;
    take?: number;
    saleId?: string;
    branchId?: number;
  }) => {
    const where: any = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.movementType) where.movementType = filters.movementType;
    if (filters.saleId) where.saleId = filters.saleId;

    if (filters.branchId !== undefined) {
      where.product = {
        branchId: filters.branchId
      };
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true, branchId: true }
          },
          provider: {
            select: { id_provider: true, name: true }
          },
          sale: {
            select: { id: true, total: true, createdAt: true }
          },
          user: {
            select: { id: true, name: true, userCode: true }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ]);

    return { movements, total };
  },

  getProductHistory: async (productId: string, branchId?: number, limit: number = 50) => {
    const where: any = { productId };
    
    // Filtrar directamente por branchId a través de la relación con Product
    if (branchId !== undefined) {
      where.product = {
        branchId: branchId
      };
    }

    return prisma.stockMovement.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            branchId: true, // ← Incluir branchId para verificación en frontend
            branch: { select: { name: true } } // ← Incluir información de la sucursal
          }
        },
        provider: {
          select: { name: true }
        },
        user: {
          select: { name: true, userCode: true }
        },
        sale: {
          select: { 
            id: true,
            total: true,
            createdAt: true,
            client: {
              select: { nombre: true }
            },
            seller: {
              select: { name: true, userCode: true }
            },
            paymentStatus: true
          }
        },
        return: {
          select: {
            id: true,
            reason: true
          }
        }
      }
    });
  },
};

export const PriceHistoryRepository = {
  create: async (data: {
    productId: string;
    oldPrice: number;
    newPrice: number;
    priceType: string;
    changedBy: string;
    notes?: string;
  }) => {
    return prisma.priceHistory.create({
      data,
      include: {
        user: {
          select: { name: true, userCode: true }
        }
      }
    });
  },

  findByProduct: async (productId: string, limit: number = 20) => {
    return prisma.priceHistory.findMany({
      where: { productId },
      take: limit,
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: { name: true, userCode: true }
        }
      }
    });
  },
  findAllByProduct: async (productId: string) => {
    return prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: { name: true, userCode: true }
        }
      }
    });
  }
};