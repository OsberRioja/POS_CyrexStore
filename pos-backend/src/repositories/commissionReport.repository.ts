import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const CommissionReportRepository = {
  /**
   * Obtener comisiones por usuario y mes/año
   */
  async findByUserAndMonth(userId: string, month: number, year: number) {
    return await prisma.commission.findMany({
      where: {
        userId,
        month,
        year
      },
      include: {
        sale: {
          include: {
            client: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        calculatedAt: 'desc'
      }
    });
  },

  /**
   * Obtener resumen de comisiones por mes/año
   */
  async getSummaryByMonth(month: number, year: number) {
    return await prisma.commission.groupBy({
      by: ['userId'],
      where: {
        month,
        year
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
  },

  /**
   * Obtener todas las comisiones por mes/año con paginación
   */
  async getCommissionsByMonth(month: number, year: number, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where: {
          month,
          year
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              userCode: true
            }
          },
          sale: {
            select: {
              id: true,
              total: true,
              createdAt: true,
              client: {
                select: {
                  nombre: true
                }
              }
            }
          }
        },
        orderBy: {
          calculatedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.commission.count({
        where: {
          month,
          year
        }
      })
    ]);

    return {
      data: commissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * Obtener el total de comisiones por usuario en un rango de fechas
   */
  async getUserCommissionsSummary(userId: string, startDate: Date, endDate: Date) {
    return await prisma.commission.aggregate({
      where: {
        userId,
        calculatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
  }
};