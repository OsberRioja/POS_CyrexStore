import { CashBoxRepository } from "../repositories/cashBox.repository";
import { PrismaClient, Prisma, CashBoxStatus } from "@prisma/client";
import type { OpenCashBoxDTO, CloseCashBoxDTO } from "../dtos/cashBox.dto";

const prisma = new PrismaClient();

export const CashBoxService = {
  async open(openDto: OpenCashBoxDTO, actorUserId: string) {
    if (!openDto || typeof openDto.initialAmount !== "number" || Number.isNaN(openDto.initialAmount)) {
      throw { status: 400, message: "initialAmount es requerido y debe ser número" };
    }

    if (openDto.initialAmount < 0) {
      throw { status: 400, message: "El monto inicial no puede ser negativo" };
    }

    // Verificar que no haya caja abierta
    const existing = await CashBoxRepository.findOpen();
    if (existing) throw { status: 400, message: "Ya existe una caja abierta" };

    const created = await CashBoxRepository.create({
      openedBy: actorUserId,
      initialAmount: openDto.initialAmount,
      status: "OPEN",
    });

    return created;
  },

  async getOpen() {
    const open = await CashBoxRepository.findOpen();
    if (!open) return null;
    
    // Incluir información del usuario que abrió la caja
    return await prisma.cashBox.findUnique({
      where: { id: open.id },
      include: {
        openedByUser: {
          select: { name: true, userCode: true }
        }
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

      // 5) Preparar datos de actualización - CORREGIDO: usar tipo any para evitar problemas complejos
      const updateData: any = {
        status: CashBoxStatus.CLOSED, // ← USAR EL ENUM
        closedAt: new Date(),
        closedBy: actorUserId,
        closedAmount: Number(expectedAmount.toFixed(2)),
        expectedAmount: Number(expectedAmount.toFixed(2)),
        realClosedAmount: Number(realClosedAmount.toFixed(2)),
        difference: Number(difference.toFixed(2)),
        observations: closeDto.observations || null,
      };

      // 6) Manejar cashCount correctamente (usar Prisma.JsonNull para null)
      if (closeDto.cashCount !== undefined) {
        updateData.cashCount = closeDto.cashCount === null ? Prisma.JsonNull : closeDto.cashCount;
      }

      // 7) Actualizar caja con todos los datos
      const closed = await tx.cashBox.update({
        where: { id: boxId },
        data: updateData,
        include: {
          openedByUser: { select: { name: true, userCode: true } },
          closedByUser: { select: { name: true, userCode: true } }
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
        sales: {
          include: {
            items: true,
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

    return box;
  },

  async list(params?: { page?: number; limit?: number; status?: 'OPEN' | 'CLOSED' }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where = params?.status ? { status: params.status } : {};

    const [boxes, total] = await Promise.all([
      prisma.cashBox.findMany({
        where,
        skip,
        take: limit,
        include: {
          openedByUser: { select: { name: true, userCode: true } },
          closedByUser: { select: { name: true, userCode: true } },
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
        openedByUser: { select: { name: true, userCode: true } }
      }
    });

    if (!box) throw { status: 404, message: "Caja no encontrada" };
    if (box.status !== "OPEN") throw { status: 400, message: "La caja ya está cerrada" };

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
        totalOtherSales: totalCardSales, // Por ahora solo tarjeta como "otros"
        expectedClosedAmount,
      },
    };
  },
};