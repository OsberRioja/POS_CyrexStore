// src/services/paymentMethod.service.ts
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";
import type { CreatePaymentMethodDTO, UpdatePaymentMethodDTO } from "../dtos/paymentMethod.dto";
import { Prisma } from "@prisma/client";

const DEFAULTS = [
  { name: "EFECTIVO", isCash: true },
  { name: "TARJETA", isCash: false },
];

export const PaymentMethodService = {
  async listAll() {
    return PaymentMethodRepository.findAll();
  },

  async getById(id?: number | string) {
    if (!id) throw { status: 400, message: "id requerido" };
    try {
      const m = await PaymentMethodRepository.findById(id);
      if (!m) throw { status: 404, message: "Método no encontrado" };
      return m;
    } catch (err: any) {
      throw { status: 400, message: err?.message ?? "id inválido" };
    }
  },


  async create(dto: CreatePaymentMethodDTO) {
    if (!dto?.name || !dto.name.trim()) throw { status: 400, message: "name es requerido" };
    try {
      const created = await PaymentMethodRepository.create({ name: dto.name.trim(), iscash: dto.isCash ?? false});
      return created;
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw { status: 409, message: "Método de pago ya existe" };
      }
      throw { status: 500, message: "Error al crear método de pago" };
    }
  },

  async update(id: number, dto: UpdatePaymentMethodDTO) {
    // validar existencia
    const existing = await PaymentMethodRepository.findById(id);
    if (!existing) throw { status: 404, message: "Método de pago no encontrado" };

    if (dto.name && !dto.name.trim()) throw { status: 400, message: "name vacío" };

    try {
      const dataToUpdate: any = {};
      if (dto.name !== undefined) {
        dataToUpdate.name = dto.name.trim();
      }
      if (dto.isCash !== undefined) { // ✅ Incluir isCash
        dataToUpdate.isCash = dto.isCash;
      }

      const updated = await PaymentMethodRepository.update(id, dataToUpdate);
      return updated;
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw { status: 409, message: "Nombre ya está en uso" };
      }
      throw { status: 500, message: "Error al actualizar método de pago" };
    }
  },

  async remove(id: number) {
    const existing = await PaymentMethodRepository.findById(id);
    if (!existing) throw { status: 404, message: "Método de pago no encontrado" };
    // opcional: revisar si hay ventas asociadas antes de borrar (recomendado)
    try {
      const deleted = await PaymentMethodRepository.delete(id);
      return deleted;
    } catch (err: any) {
      throw { status: 500, message: "Error al eliminar método de pago" };
    }
  },

  /** Crea métodos por defecto si no existen (idempotente) */
  async ensureDefaults() {
    const created: any[] = [];
    for (const def of DEFAULTS) {
      try {
        const pm = await PaymentMethodRepository.upsertByName(def.name, def.isCash);
        created.push(pm);
      } catch (err) {
        // ignorar y continuar
        console.warn("ensureDefaults: error upsert", def, err);
      }
    }
    return created;
  },

  // -> Nuevo: devuelve lista de métodos de pago con total para la cashbox solicitada
  async summaryByCashBox(cashBoxId?: number | string) {
    if (!cashBoxId) throw { status: 400, message: "cashBoxId requerido" };
    const cbn = Number(cashBoxId);
    if (Number.isNaN(cbn)) throw { status: 400, message: "cashBoxId inválido" };
    return PaymentMethodRepository.summaryByCashBox(cbn);
  },
};
