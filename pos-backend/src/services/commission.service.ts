import { CommissionRepository } from "../repositories/commission.repository";
import type { CommissionConfigDTO, UpdateCommissionConfigDTO } from "../dtos/commission.dto";

export const CommissionService = {
  /**
   * Obtener la configuración activa
   */
  async getActive() {
    return await CommissionRepository.findActive();
  },

  /**
   * Obtener todas las configuraciones
   */
  async getAll() {
    return await CommissionRepository.findAll();
  },

  /**
   * Obtener una configuración por ID
   */
  async getById(id: string) {
    const config = await CommissionRepository.findById(id);
    if (!config) {
      throw { status: 404, message: "Configuración de comisiones no encontrada" };
    }
    return config;
  },

  /**
   * Crear una nueva configuración
   */
  async create(data: CommissionConfigDTO, userId: string) {
    // Validar que solo haya una configuración activa si se está activando
    if (data.isActive) {
      await CommissionRepository.deactivateAll();
    }

    return await CommissionRepository.create({ ...data, createdBy: userId });
  },

  /**
   * Actualizar una configuración
   */
  async update(id: string, data: UpdateCommissionConfigDTO) {
    const existing = await CommissionRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Configuración de comisiones no encontrada" };
    }

    // Si se está activando, desactivar las demás
    if (data.isActive) {
      await CommissionRepository.deactivateAll();
    }

    return await CommissionRepository.update(id, { ...data, updatedAt: new Date() });
  },

  /**
   * Activar una configuración
   */
  async activate(id: string) {
    const existing = await CommissionRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Configuración de comisiones no encontrada" };
    }

    return await CommissionRepository.activate(id);
  },

  /**
   * Eliminar una configuración
   */
  async delete(id: string) {
    const existing = await CommissionRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Configuración de comisiones no encontrada" };
    }

    // No permitir eliminar la configuración activa
    if (existing.isActive) {
      throw { status: 400, message: "No se puede eliminar la configuración activa" };
    }

    return await CommissionRepository.delete(id);
  }
};