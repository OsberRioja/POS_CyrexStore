"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionService = void 0;
const commission_repository_1 = require("../repositories/commission.repository");
exports.CommissionService = {
    /**
     * Obtener la configuración activa
     */
    async getActive() {
        return await commission_repository_1.CommissionRepository.findActive();
    },
    /**
     * Obtener todas las configuraciones
     */
    async getAll() {
        return await commission_repository_1.CommissionRepository.findAll();
    },
    /**
     * Obtener una configuración por ID
     */
    async getById(id) {
        const config = await commission_repository_1.CommissionRepository.findById(id);
        if (!config) {
            throw { status: 404, message: "Configuración de comisiones no encontrada" };
        }
        return config;
    },
    /**
     * Crear una nueva configuración
     */
    async create(data, userId) {
        // Validar que solo haya una configuración activa si se está activando
        if (data.isActive) {
            await commission_repository_1.CommissionRepository.deactivateAll();
        }
        return await commission_repository_1.CommissionRepository.create({ ...data, createdBy: userId });
    },
    /**
     * Actualizar una configuración
     */
    async update(id, data) {
        const existing = await commission_repository_1.CommissionRepository.findById(id);
        if (!existing) {
            throw { status: 404, message: "Configuración de comisiones no encontrada" };
        }
        // Si se está activando, desactivar las demás
        if (data.isActive) {
            await commission_repository_1.CommissionRepository.deactivateAll();
        }
        return await commission_repository_1.CommissionRepository.update(id, { ...data, updatedAt: new Date() });
    },
    /**
     * Activar una configuración
     */
    async activate(id) {
        const existing = await commission_repository_1.CommissionRepository.findById(id);
        if (!existing) {
            throw { status: 404, message: "Configuración de comisiones no encontrada" };
        }
        return await commission_repository_1.CommissionRepository.activate(id);
    },
    /**
     * Eliminar una configuración
     */
    async delete(id) {
        const existing = await commission_repository_1.CommissionRepository.findById(id);
        if (!existing) {
            throw { status: 404, message: "Configuración de comisiones no encontrada" };
        }
        // No permitir eliminar la configuración activa
        if (existing.isActive) {
            throw { status: 400, message: "No se puede eliminar la configuración activa" };
        }
        return await commission_repository_1.CommissionRepository.delete(id);
    }
};
