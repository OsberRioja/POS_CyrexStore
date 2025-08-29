import { CashBoxRepository } from "../repositories/cashBox.repository";
import { SaleRepository } from "../repositories/sale.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { OpenCashBoxDTO } from "../dtos/cashBox.dto";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();  


export const CashBoxService = {
    /**
   * Abre una nueva caja.
   * @param openDto datos de apertura (initialAmount)
   * @param actorUserId id del usuario que ejecuta la acción (se puede pasar desde el controller)
   */
  async open(openDto: OpenCashBoxDTO,actorUserId:string) { 
    // verificar que no exista caja abierta
    const open = await CashBoxRepository.findOpen();
    if (open) throw { status: 400, message: "Ya hay una caja abierta" };
    const box = await CashBoxRepository.create({
      openedBy: openDto.openedBy,
      initialAmount: openDto.initialAmount,
      status: "OPEN",
    });
    return box;
  },
  async close(id:number, closedBy:string) {
    const box = await CashBoxRepository.findById(id);
    if (!box) throw { status: 404};
    // calcular ventas en efectivo (sumar payments.amount where paymentMethod.name = 'Efectivo') y gastos en efectivo
    // ejemplo simplificado:
    //const sales = await SaleRepository.findByBox(id);
    const expenses = await ExpenseRepository.findAllByBox(id);
    const salesCash = await prisma.salePayment.aggregate({ where: { cashBoxId: id }, _sum: { amount: true }});
    const expensesCash = await prisma.expense.aggregate({ where: { cashBoxId: id }, _sum: { amount: true }});
    const closedAmount = (box.initialAmount ?? 0) + (salesCash._sum.amount ?? 0) - (expensesCash._sum.amount ?? 0);
    await CashBoxRepository.update(id, { status: "CLOSED", closedAt: new Date(), closedBy, closedAmount });
    //return { closedAmount, sales, expenses };
  }
};
