import { CashBoxRepository } from "../repositories/cashBox.repository";
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";
import { PrismaClient } from "@prisma/client";
import type { OpenCashBoxDTO, CloseCashBoxDTO } from "../dtos/cashBox.dto";

const prisma = new PrismaClient();

export const CashBoxService = {
  async open(openDto: OpenCashBoxDTO, actorUserId: string) {
    if (!openDto || typeof openDto.initialAmount !== "number" || Number.isNaN(openDto.initialAmount)) {
      throw { status: 400, message: "initialAmount es requerido y debe ser número" };
    }

    // verificar que no haya caja abierta
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
    return open;
  },

  /**
   * Cerrar caja: calcula totales en efectivo asociados a la caja y actualiza la caja.
   * Devuelve reporte con: initialAmount, totalCashSales, totalCashExpenses, closedAmount, details
   */
  async close(boxId: number, actorUserId: string, closeDto?: CloseCashBoxDTO) {
    // validar existencia
    const box = await CashBoxRepository.findById(boxId);
    if (!box) throw { status: 404, message: "Caja no encontrada" };
    if (box.status !== "OPEN") throw { status: 400, message: "Caja ya está cerrada" };

    // 1) calcular total pagos en efectivo en esta caja
    const paymentsSum = await prisma.salePayment.aggregate({
      _sum: { amount: true },
      where: { cashBoxId: boxId, paymentMethod: { isCash: true } }, // solo efectivo
    });
    const totalCashSales = paymentsSum._sum.amount ?? 0;

    // 2) calcular total gastos en efectivo para esta caja
    const expensesSum = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        cashBoxId: boxId,
        paymentMethod: { isCash: true }, // solo efectivo
      },
    });
    const totalCashExpenses = expensesSum._sum.amount ?? 0;

    // 3) calcular closedAmount = initialAmount + totalCashSales - totalCashExpenses
    const closedAmount = Number(box.initialAmount) + Number(totalCashSales) - Number(totalCashExpenses);

    // 4) actualizar caja
    const closed = await CashBoxRepository.update(boxId, {
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: actorUserId,
      closedAmount,
    });

    // 5) opcional: guardar cashCount en campo JSON si te interesa (si lo añadiste al schema)
    // if (closeDto?.cashCount) { await CashBoxRepository.update(boxId, { cashCount: closeDto.cashCount }); }

    // 6) devolver reporte resumido
    return {
      box: closed,
      report: {
        initialAmount: box.initialAmount,
        totalCashSales,
        totalCashExpenses,
        closedAmount,
      },
    };
  },

  async getById(boxId: number) {
    const box = await CashBoxRepository.findById(boxId);
    if (!box) throw { status: 404, message: "Caja no encontrada" };
    // si quieres, puedes incluir ventas/expenses con findMany aquí
    const sales = await prisma.sale.findMany({ where: { cashBoxId: boxId }, include: { items: true, payments: true } });
    const expenses = await prisma.expense.findMany({ where: { cashBoxId: boxId }, include: { paymentMethod: true } });
    return { box, sales, expenses };
  },

  async list(params?: { page?: number; limit?: number; status?: 'OPEN' | 'CLOSED' }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where = params?.status ? { status: params.status } : {};

    const [boxes, total] = await Promise.all([
      CashBoxRepository.findMany({ where, skip, take: limit }),
      CashBoxRepository.count(where)
    ]);

    return {
      total,
      data: boxes,
      page,
      limit
    };
  },

    async getClosePreview(boxId: number) {
      const box = await CashBoxRepository.findById(boxId);
      if (!box) throw { status: 404, message: "Caja no encontrada" };
      if (box.status !== "OPEN") throw { status: 400, message: "La caja ya está cerrada" };

      // Calcular totales - solo efectivo
      const paymentsSum = await prisma.salePayment.aggregate({
        _sum: { amount: true },
        where: { cashBoxId: boxId, paymentMethod: { isCash: true  } }, // solo efectivo
      });
      const totalCashSales = paymentsSum._sum.amount ?? 0;

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
          expectedClosedAmount,
        },
      };
    },
};
