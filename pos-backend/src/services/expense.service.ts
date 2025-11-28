// src/services/expense.service.ts
import { ExpenseRepository } from "../repositories/expense.repository";
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";
import { CashBoxRepository } from "../repositories/cashBox.repository";
import type { CreateExpenseDTO } from "../dtos/expense.dto";

export const ExpenseService = {
  /**
   * Crea un gasto y lo liga a la caja abierta.
   * Reglas:
   * - Debe existir caja abierta: si no -> error 400
   * - El gasto se guarda con cashBoxId = openBox.id (siempre)
   */
  async createExpense(dto: CreateExpenseDTO, actorUserId: string, branchId: number) {
    // validaciones básicas
    if (!dto || typeof dto.amount !== "number" || Number.isNaN(dto.amount) || dto.amount <= 0) {
      throw { status: 400, message: "amount debe ser número mayor a 0" };
    }
    if (!dto.concept || !dto.concept.trim()) {
      throw { status: 400, message: "concept es requerido" };
    }

    // comprobar payment method existe
    const pm = await PaymentMethodRepository.findById(dto.paymentMethodId);
    if (!pm) {
      throw { status: 404, message: "Método de pago no encontrado" };
    }

    // comprobar caja abierta EN LA SUCURSAL
    const openBox = await CashBoxRepository.findOpenByBranch(branchId);
    if (!openBox) {
      throw { status: 400, message: "No hay caja abierta. Abra una caja antes de registrar gastos." };
    }

    // crear gasto ligado a la caja abierta y sucursal
    // siempre ligamos a la caja abierta (según tu regla)
    const created = await ExpenseRepository.create({
      amount: dto.amount,
      concept: dto.concept.trim(),
      paymentMethodId: dto.paymentMethodId,
      cashBoxId: openBox.id,
      createdBy: actorUserId,
      branchId: branchId,
      note: dto.note ?? undefined,
    });

    return created;
  },

  async listByBox(boxId: number) {
    return ExpenseRepository.findByBox(boxId);
  },

  async listAll(branchId?: number) {
    return ExpenseRepository.findAll(branchId);
  },

  async getById(id: number) {
    const e = await ExpenseRepository.findById(id);
    if (!e) throw { status: 404, message: "Gasto no encontrado" };
    return e;
  },
};
