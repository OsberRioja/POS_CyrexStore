"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodService = void 0;
// src/services/paymentMethod.service.ts
const paymentMethod_repository_1 = require("../repositories/paymentMethod.repository");
const client_1 = require("@prisma/client");
const DEFAULTS = [
    { name: "EFECTIVO", isCash: true },
    { name: "TARJETA", isCash: false },
];
exports.PaymentMethodService = {
    async listAll() {
        return paymentMethod_repository_1.PaymentMethodRepository.findAll();
    },
    async getById(id) {
        if (!id)
            throw { status: 400, message: "id requerido" };
        try {
            const m = await paymentMethod_repository_1.PaymentMethodRepository.findById(id);
            if (!m)
                throw { status: 404, message: "Método no encontrado" };
            return m;
        }
        catch (err) {
            throw { status: 400, message: err?.message ?? "id inválido" };
        }
    },
    async create(dto) {
        if (!dto?.name || !dto.name.trim())
            throw { status: 400, message: "name es requerido" };
        try {
            const created = await paymentMethod_repository_1.PaymentMethodRepository.create({ name: dto.name.trim(), iscash: dto.isCash ?? false });
            return created;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw { status: 409, message: "Método de pago ya existe" };
            }
            throw { status: 500, message: "Error al crear método de pago" };
        }
    },
    async update(id, dto) {
        // validar existencia
        const existing = await paymentMethod_repository_1.PaymentMethodRepository.findById(id);
        if (!existing)
            throw { status: 404, message: "Método de pago no encontrado" };
        if (dto.name && !dto.name.trim())
            throw { status: 400, message: "name vacío" };
        try {
            const dataToUpdate = {};
            if (dto.name !== undefined) {
                dataToUpdate.name = dto.name.trim();
            }
            if (dto.isCash !== undefined) { // ✅ Incluir isCash
                dataToUpdate.isCash = dto.isCash;
            }
            const updated = await paymentMethod_repository_1.PaymentMethodRepository.update(id, dataToUpdate);
            return updated;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw { status: 409, message: "Nombre ya está en uso" };
            }
            throw { status: 500, message: "Error al actualizar método de pago" };
        }
    },
    async remove(id) {
        const existing = await paymentMethod_repository_1.PaymentMethodRepository.findById(id);
        if (!existing)
            throw { status: 404, message: "Método de pago no encontrado" };
        // opcional: revisar si hay ventas asociadas antes de borrar (recomendado)
        try {
            const deleted = await paymentMethod_repository_1.PaymentMethodRepository.delete(id);
            return deleted;
        }
        catch (err) {
            throw { status: 500, message: "Error al eliminar método de pago" };
        }
    },
    /** Crea métodos por defecto si no existen (idempotente) */
    async ensureDefaults() {
        const created = [];
        for (const def of DEFAULTS) {
            try {
                const pm = await paymentMethod_repository_1.PaymentMethodRepository.upsertByName(def.name, def.isCash);
                created.push(pm);
            }
            catch (err) {
                // ignorar y continuar
                console.warn("ensureDefaults: error upsert", def, err);
            }
        }
        return created;
    },
    // -> Nuevo: devuelve lista de métodos de pago con total para la cashbox solicitada
    async summaryByCashBox(cashBoxId) {
        if (!cashBoxId)
            throw { status: 400, message: "cashBoxId requerido" };
        const cbn = Number(cashBoxId);
        if (Number.isNaN(cbn))
            throw { status: 400, message: "cashBoxId inválido" };
        return paymentMethod_repository_1.PaymentMethodRepository.summaryByCashBox(cbn);
    },
};
