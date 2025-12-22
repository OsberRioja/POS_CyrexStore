import { CashBoxRepository } from "../repositories/cashBox.repository";
import { PrismaClient, Prisma, CashBoxStatus } from "@prisma/client";
import type { OpenCashBoxDTO, CloseCashBoxDTO } from "../dtos/cashBox.dto";

const prisma = new PrismaClient();

function calculateProfitData(box: any) {
  let totalSales = 0;
  let totalCost = 0;
  let totalGrossProfit = 0;
  let totalExpenses = 0;
  let totalNetProfit = 0;

  // Calcular total de ventas y costos
  if (box.sales && box.sales.length > 0) {
    box.sales.forEach((sale: any) => {
      totalSales += sale.total || 0;

      // Calcular costo de los productos vendidos
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item: any) => {
          const itemCost = (item.product?.costPrice || 0) * item.quantity;
          totalCost += itemCost;
        });
      }
    });

    totalGrossProfit = totalSales - totalCost;
  }

  // Calcular total de gastos
  if (box.expenses && box.expenses.length > 0) {
    box.expenses.forEach((expense: any) => {
      totalExpenses += expense.amount || 0;
    });
  }

  // Calcular ganancia neta
  totalNetProfit = totalGrossProfit - totalExpenses;

  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalGrossProfit: Number(totalGrossProfit.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    totalNetProfit: Number(totalNetProfit.toFixed(2)),
    marginPercentage: totalSales > 0 ? Number(((totalGrossProfit / totalSales) * 100).toFixed(2)) : 0,
    profitPerSale: box.sales?.length > 0 ? Number((totalGrossProfit / box.sales.length).toFixed(2)) : 0
  };
}

export const CashBoxService = {
  async open(openDto: OpenCashBoxDTO, actorUserId: string, branchId: number) {
    if (!openDto || typeof openDto.initialAmount !== "number" || Number.isNaN(openDto.initialAmount)) {
      throw { status: 400, message: "initialAmount es requerido y debe ser número" };
    }

    if (openDto.initialAmount < 0) {
      throw { status: 400, message: "El monto inicial no puede ser negativo" };
    }

    // Verificar que no haya caja abierta EN LA MISMA SUCURSAL
    const existing = await CashBoxRepository.findOpenByBranch(branchId);
    if (existing) throw { status: 400, message: "Ya existe una caja abierta en esta sucursal" };

    const created = await CashBoxRepository.create({
      openedBy: actorUserId,
      initialAmount: openDto.initialAmount,
      status: "OPEN",
      branchId: branchId,
    });

    return created;
  },

  async getOpen(branchId: number) {
    const open = await CashBoxRepository.findOpenByBranch(branchId);
    if (!open) return null;

    return await prisma.cashBox.findUnique({
      where: { id: open.id },
      include: {
        openedByUser: {
          select: { name: true, userCode: true }
        },
        branch: { select: { name: true } }
      }
    });
  },

  async close(boxId: number, actorUserId: string, closeDto: CloseCashBoxDTO) {
    if (typeof closeDto.realClosedAmount !== 'number' || isNaN(closeDto.realClosedAmount)) {
      throw { status: 400, message: "realClosedAmount es requerido y debe ser un número" };
    }

    if (closeDto.realClosedAmount < 0) {
      throw { status: 400, message: "El monto real no puede ser negativo" };
    }

    // Validar existencia
    const box = await CashBoxRepository.findById(boxId);
    if (!box) throw { status: 404, message: "Caja no encontrada" };
    if (box.status !== "OPEN") throw { status: 400, message: "Caja ya está cerrada" };

    return await prisma.$transaction(async (tx) => {
      // 1) Calcular total pagos en efectivo en esta caja
      const paymentsSum = await tx.salePayment.aggregate({
        _sum: { amount: true },
        where: { cashBoxId: boxId, paymentMethod: { isCash: true } },
      });
      const totalCashSales = paymentsSum._sum.amount ?? 0;

      // 2) Calcular total gastos en efectivo para esta caja
      const expensesSum = await tx.expense.aggregate({
        _sum: { amount: true },
        where: {
          cashBoxId: boxId,
          paymentMethod: { isCash: true },
        },
      });
      const totalCashExpenses = expensesSum._sum.amount ?? 0;

      // 3) Calcular expectedAmount (lo que el sistema espera)
      const expectedAmount = Number(box.initialAmount) + Number(totalCashSales) - Number(totalCashExpenses);

      // 4) Calcular diferencia (positivo = excedente, negativo = faltante)
      const realClosedAmount = Number(closeDto.realClosedAmount);
      const difference = realClosedAmount - expectedAmount;

      // 5) Preparar datos de actualización
      const updateData: any = {
        status: CashBoxStatus.CLOSED,
        closedAt: new Date(),
        closedBy: actorUserId,
        closedAmount: Number(expectedAmount.toFixed(2)),
        expectedAmount: Number(expectedAmount.toFixed(2)),
        realClosedAmount: Number(realClosedAmount.toFixed(2)),
        difference: Number(difference.toFixed(2)),
        observations: closeDto.observations || null,
      };

      // 6) Manejar cashCount correctamente
      if (closeDto.cashCount !== undefined) {
        updateData.cashCount = closeDto.cashCount === null ? Prisma.JsonNull : closeDto.cashCount;
      }

      // 7) Actualizar caja con todos los datos
      const closed = await tx.cashBox.update({
        where: { id: boxId },
        data: updateData,
        include: {
          openedByUser: { select: { name: true, userCode: true } },
          closedByUser: { select: { name: true, userCode: true } },
          branch: { select: { name: true } }
        }
      });

      // 8) Devolver reporte completo
      return {
        box: closed,
        report: {
          initialAmount: box.initialAmount,
          totalCashSales,
          totalCashExpenses,
          expectedAmount,
          realClosedAmount,
          difference,
          observations: closeDto.observations,
          cashCount: closeDto.cashCount,
          status: difference === 0 ? 'exact' : difference > 0 ? 'surplus' : 'shortage',
          statusText: difference === 0
            ? 'Cuadre exacto'
            : difference > 0
              ? `Excedente de Bs. ${Math.abs(difference).toFixed(2)}`
              : `Faltante de Bs. ${Math.abs(difference).toFixed(2)}`
        },
      };
    });
  },

  async getById(boxId: number) {
    const box = await prisma.cashBox.findUnique({
      where: { id: boxId },
      include: {
        openedByUser: { select: { name: true, userCode: true } },
        closedByUser: { select: { name: true, userCode: true } },
        branch: { select: { name: true } },
        sales: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    costPrice: true,
                    salePrice: true,
                    priceCurrency: true
                  }
                }
              }
            },
            payments: {
              include: { paymentMethod: true }
            },
            seller: {
              select: { name: true, userCode: true }
            },
            client: true
          }
        },
        expenses: {
          include: {
            paymentMethod: true,
            user: {
              select: {
                name: true,
                userCode: true
              }
            }
          }
        }
      }
    });

    if (!box) throw { status: 404, message: "Caja no encontrada" };

    // NUEVO: Calcular ganancias netas
    const profitData = calculateProfitData(box);

    return {
      ...box,
      profitData
    };
  },

  async list(params?: { page?: number; limit?: number; status?: 'OPEN' | 'CLOSED'; branchId?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.status) where.status = params.status;
    // Filtrar por sucursal
    if (params?.branchId !== undefined) where.branchId = params.branchId;

    const [boxes, total] = await Promise.all([
      prisma.cashBox.findMany({
        where,
        skip,
        take: limit,
        include: {
          openedByUser: { select: { name: true, userCode: true } },
          closedByUser: { select: { name: true, userCode: true } },
          branch: { select: { name: true } },
          _count: {
            select: {
              sales: true,
              expenses: true
            }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.cashBox.count({ where })
    ]);

    return {
      total,
      data: boxes,
      page,
      limit
    };
  },

  async getClosePreview(boxId: number) {
    const box = await prisma.cashBox.findUnique({
      where: { id: boxId },
      include: {
        openedByUser: { select: { name: true, userCode: true } },
        branch: { select: { name: true } }
      }
    });

    if (!box) throw { status: 404, message: "Caja no encontrada" };
    if (box.status !== "OPEN" && box.status !== "REOPENED") throw { status: 400, message: "La caja ya está cerrada" };

    // Calcular totales - solo efectivo
    const paymentsSum = await prisma.salePayment.aggregate({
      _sum: { amount: true },
      where: { cashBoxId: boxId, paymentMethod: { isCash: true } },
    });
    const totalCashSales = paymentsSum._sum.amount ?? 0;

    // Calcular ventas con tarjeta para contexto
    const cardPaymentsSum = await prisma.salePayment.aggregate({
      _sum: { amount: true },
      where: { cashBoxId: boxId, paymentMethod: { isCash: false } },
    });
    const totalCardSales = cardPaymentsSum._sum.amount ?? 0;

    const expensesSum = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        cashBoxId: boxId,
        paymentMethod: { isCash: true },
      },
    });
    const totalCashExpenses = expensesSum._sum.amount ?? 0;

    const expectedClosedAmount = Number(box.initialAmount) + Number(totalCashSales) - Number(totalCashExpenses);

    return {
      box,
      report: {
        initialAmount: box.initialAmount,
        totalCashSales,
        totalCashExpenses,
        totalCardSales,
        totalOtherSales: totalCardSales,
        expectedClosedAmount,
      },
    };
  },

  // Reabrir cajas
  async reopen(boxId: number, actorUserId: string) {
    // verificar que la caja exista y esté cerrada
    const box = await CashBoxRepository.findById(boxId);
    if (!box) throw { status: 404, message: "Caja no encontrada" };
    if (box.status !== "CLOSED") throw { status: 400, message: "La caja ya está abierta" };

    return await prisma.$transaction(async (tx) => {
      return await tx.cashBox.update({
        where: { id: boxId },
        data: {
          status: "REOPENED",
          reopenedAt: new Date(),
          reopenedById: actorUserId,
        },
        include: {
          openedByUser: { select: { name: true, userCode: true } },
          closedByUser: { select: { name: true, userCode: true } },
          reopenedByUser: { select: { name: true, userCode: true } },
          branch: { select: { name: true } }
        }
      });
    });
  },

  async closeReopened(boxId: number, actorUserId: string) {
    const box = await CashBoxRepository.findById(boxId);

    if (!box) throw { status: 404, message: "Caja no encontrada" };
    if (box.status !== "REOPENED") throw { status: 400, message: "Solo se pueden cerrar cajas reabiertas" };

    return await prisma.$transaction(async (tx) => {
      // Recalcular totales de ventas y gastos actualizados
      const paymentsSum = await tx.salePayment.aggregate({
        _sum: { amount: true },
        where: { cashBoxId: boxId, paymentMethod: { isCash: true } },
      });
      const totalCashSales = paymentsSum._sum.amount ?? 0;

      const expensesSum = await tx.expense.aggregate({
        _sum: { amount: true },
        where: {
          cashBoxId: boxId,
          paymentMethod: { isCash: true },
        },
      });
      const totalCashExpenses = expensesSum._sum.amount ?? 0;

      // El expectedAmount se recalcula con los nuevos totales
      const expectedAmount = Number(box.initialAmount) + Number(totalCashSales) - Number(totalCashExpenses);

      // Mantener el realClosedAmount original (no se vuelve a contar el dinero)
      const realClosedAmount = box.realClosedAmount || 0;

      // Calcular nueva diferencia
      const difference = realClosedAmount - expectedAmount;

      return await tx.cashBox.update({
        where: { id: boxId },
        data: {
          status: "CLOSED",
          expectedAmount: Number(expectedAmount.toFixed(2)),
          difference: Number(difference.toFixed(2)),
          // No actualizamos realClosedAmount, cashCount ni observations
        },
        include: {
          openedByUser: { select: { name: true, userCode: true } },
          closedByUser: { select: { name: true, userCode: true } },
          reopenedByUser: { select: { name: true, userCode: true } },
          branch: { select: { name: true } }
        }
      });
    });
  },
};