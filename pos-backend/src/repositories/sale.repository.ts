import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const SaleRepository = {
  async create(payload: any) {
    return prisma.sale.create({
      data: {
        sellerId: payload.sellerId,
        clientId: payload.clientId ?? undefined,
        total: payload.total,
        totalPaid: payload.totalPaid ?? 0,
        balance: payload.balance ?? payload.total,
        paymentStatus: payload.paymentStatus ?? PaymentStatus.PENDING,
        createdBy: payload.createdBy ?? undefined,
        cashBoxId: payload.cashBoxId ?? undefined,
        branchId: payload.branchId, // ← NUEVO
        items: { create: payload.items },
        payments: { create: payload.payments },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        payments: {
          include: {
            paymentMethod: {
              select: {
                name: true,
                isCash: true
              }
            }
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            userCode: true
          }
        },
        client: true,
        branch: { select: { name: true } } // ← NUEVO
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
    paymentStatus?: PaymentStatus;
    branchId?: number; // ← NUEVO: Filtrar por sucursal
  }) {
    const { page = 1, limit = 20, sellerId, cashBoxId, dateFrom, dateTo, paymentStatus, branchId } = opts;

    const where: any = {};

    if (sellerId) where.sellerId = sellerId;
    if (cashBoxId !== undefined) where.cashBoxId = Number(cashBoxId);
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // ← NUEVO: Filtrar por sucursal
    if (branchId !== undefined) {
      where.branchId = branchId;
    }

    const skip = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, limit));
    const take = Math.max(1, Math.min(limit, 100));

    console.log('SaleRepository.findAll - WHERE:', JSON.stringify(where, null, 2));

    try {
      const [total, data] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    salePrice: true
                  }
                }
              }
            },
            payments: {
              include: {
                paymentMethod: {
                  select: {
                    name: true,
                    isCash: true
                  }
                }
              }
            },
            seller: {
              select: {
                id: true,
                name: true,
                userCode: true
              }
            },
            client: true,
            branch: { select: { name: true } } // ← NUEVO
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
      ]);

      console.log(`SaleRepository.findAll - Found ${data.length} sales, total: ${total}`);

      return { total, data };
    } catch (error) {
      console.error('SaleRepository.findAll - ERROR:', error);
      throw error;
    }
  },

  async findById(id: string) {
    console.log(`SaleRepository.findById - ID: ${id}`);

    try {
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  salePrice: true
                }
              }
            }
          },
          payments: {
            include: {
              paymentMethod: {
                select: {
                  name: true,
                  isCash: true
                }
              }
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              userCode: true
            }
          },
          client: true,
          branch: { select: { name: true } } // ← NUEVO
        },
      });

      console.log(`SaleRepository.findById - Found: ${sale ? 'YES' : 'NO'}`);
      return sale;
    } catch (error) {
      console.error('SaleRepository.findById - ERROR:', error);
      throw error;
    }
  },

  async findByBox(cashBoxId: number) {
    console.log(`SaleRepository.findByBox - cashBoxId: ${cashBoxId}`);

    try {
      const sales = await prisma.sale.findMany({
        where: { cashBoxId: cashBoxId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: {
            include: {
              paymentMethod: {
                select: {
                  name: true,
                  isCash: true
                }
              }
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              userCode: true
            }
          },
          client: true,
          branch: { select: { name: true } } // ← NUEVO
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`SaleRepository.findByBox - Found ${sales.length} sales`);
      return sales;
    } catch (error) {
      console.error('SaleRepository.findByBox - ERROR:', error);
      throw error;
    }
  },

  // NUEVO: Método específico para ventas pendientes
  async findPendingSales(params: { page?: number; limit?: number; branchId?: number } = {}) {
    const { page = 1, limit = 50, branchId } = params;

    const where = {
      OR: [
        { paymentStatus: PaymentStatus.PENDING },
        { paymentStatus: PaymentStatus.PARTIAL }
      ],
      // ← NUEVO: Filtrar por sucursal si se proporciona
      ...(branchId !== undefined && { branchId })
    };

    console.log('SaleRepository.findPendingSales - WHERE:', JSON.stringify(where, null, 2));

    try {
      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            client: true,
            seller: {
              select: {
                id: true,
                name: true,
                userCode: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true
                  }
                }
              }
            },
            payments: {
              include: {
                paymentMethod: {
                  select: {
                    name: true,
                    isCash: true
                  }
                }
              }
            },
            branch: { select: { name: true } } // ← NUEVO
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.sale.count({ where })
      ]);

      console.log(`SaleRepository.findPendingSales - Found ${sales.length} pending sales`);

      return {
        data: sales,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('SaleRepository.findPendingSales - ERROR:', error);
      throw error;
    }
  }
};