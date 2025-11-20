import { PrismaClient, CommissionRangeType } from "@prisma/client";
import type { CommissionConfigDTO } from "../dtos/commission.dto";

const prisma = new PrismaClient();

export const CommissionRepository = {
  /**
   * Obtener la configuración activa de comisiones
   */
  async findActive() {
    return await prisma.commissionConfig.findFirst({
      where: { isActive: true },
      include: { ranges: true }
    });
  },

  /**
   * Obtener todas las configuraciones
   */
  async findAll() {
    return await prisma.commissionConfig.findMany({
      include: { 
        ranges: true,
        user: {
          select: {
            id: true,
            name: true,
            userCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Obtener una configuración por ID
   */
  async findById(id: string) {
    return await prisma.commissionConfig.findUnique({
      where: { id },
      include: { ranges: true }
    });
  },

  /**
   * Crear una nueva configuración de comisiones
   */
  async create(data: CommissionConfigDTO & { createdBy: string }) {
    const { ranges, ...configData } = data;

    return await prisma.commissionConfig.create({
      data: {
        ...configData,
        ranges: {
          create: ranges?.map(range => ({
            minAmount: range.minAmount,
            maxAmount: range.maxAmount,
            commissionValue: range.commissionValue,
            commissionType: range.commissionType as CommissionRangeType,
          })) || []
        }
      },
      include: { ranges: true }
    });
  },

  /**
   * Actualizar una configuración existente
   */
  async update(id: string, data: Partial<CommissionConfigDTO> & { updatedAt: Date }) {
    const { ranges, ...configData } = data;

    // Si se envían rangos, los actualizamos (eliminamos los existentes y creamos nuevos)
    if (ranges) {
      // Eliminar rangos existentes
      await prisma.commissionRange.deleteMany({
        where: { configId: id }
      });

      // Crear nuevos rangos
      await prisma.commissionRange.createMany({
        data: ranges.map(range => ({
          configId: id,
          minAmount: range.minAmount,
          maxAmount: range.maxAmount,
          commissionValue: range.commissionValue,
          commissionType: range.commissionType as CommissionRangeType,
        }))
      });
    }

    return await prisma.commissionConfig.update({
      where: { id },
      data: {
        ...configData,
        updatedAt: new Date()
      },
      include: { ranges: true }
    });
  },

  /**
   * Desactivar todas las configuraciones (para activar una nueva)
   */
  async deactivateAll() {
    return await prisma.commissionConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
  },

  /**
   * Activar una configuración específica (y desactivar las demás)
   */
  async activate(id: string) {
    // Desactivar todas
    await this.deactivateAll();

    // Activar la especificada
    return await prisma.commissionConfig.update({
      where: { id },
      data: { isActive: true }
    });
  },

  /**
   * Eliminar una configuración
   */
  async delete(id: string) {
    // Los rangos se eliminan en cascada por la relación
    return await prisma.commissionConfig.delete({
      where: { id }
    });
  }
};