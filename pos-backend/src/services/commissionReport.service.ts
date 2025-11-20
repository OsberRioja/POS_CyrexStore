import { CommissionReportRepository } from "../repositories/commissionReport.repository";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const CommissionReportService = {
  /**
   * Obtener comisiones por usuario y mes
   */
  async getCommissionsByUserAndMonth(userId: string, month: number, year: number) {
    // Validar mes y año
    if (month < 1 || month > 12) {
      throw { status: 400, message: "Mes debe estar entre 1 y 12" };
    }

    if (year < 2000 || year > 2100) {
      throw { status: 400, message: "Año inválido" };
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    return await CommissionReportRepository.findByUserAndMonth(userId, month, year);
  },

  /**
   * Obtener resumen de comisiones por mes
   */
  async getSummaryByMonth(month: number, year: number) {
    if (month < 1 || month > 12) {
      throw { status: 400, message: "Mes debe estar entre 1 y 12" };
    }

    if (year < 2000 || year > 2100) {
      throw { status: 400, message: "Año inválido" };
    }

    const summary = await CommissionReportRepository.getSummaryByMonth(month, year);

    // Obtener detalles de usuarios para el resumen
    const userDetails = await Promise.all(
      summary.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { name: true, userCode: true, email: true }
        });

        return {
          userId: item.userId,
          userName: user?.name || 'N/A',
          userCode: user?.userCode || 'N/A',
          email: user?.email || 'N/A',
          totalCommissions: item._sum.amount || 0,
          totalSales: item._count.id
        };
      })
    );

    return userDetails;
  },

  /**
   * Obtener todas las comisiones por mes con paginación
   */
  async getCommissionsByMonth(month: number, year: number, page: number = 1, limit: number = 50) {
    if (month < 1 || month > 12) {
      throw { status: 400, message: "Mes debe estar entre 1 y 12" };
    }

    if (year < 2000 || year > 2100) {
      throw { status: 400, message: "Año inválido" };
    }

    return await CommissionReportRepository.getCommissionsByMonth(month, year, page, limit);
  },

  /**
   * Obtener reporte de comisiones por usuario en un rango de fechas
   */
  async getUserCommissionsReport(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validar fechas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw { status: 400, message: "Fechas inválidas" };
    }

    if (start > end) {
      throw { status: 400, message: "La fecha de inicio no puede ser mayor a la fecha fin" };
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    const summary = await CommissionReportRepository.getUserCommissionsSummary(userId, start, end);
    const commissions = await prisma.commission.findMany({
      where: {
        userId,
        calculatedAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        sale: {
          include: {
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
      }
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        userCode: user.userCode,
        email: user.email
      },
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalCommissions: summary._sum.amount || 0,
        totalSales: summary._count.id
      },
      commissions
    };
  }
};