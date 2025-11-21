import { MovementType } from "@prisma/client";
import { StockMovementRepository, PriceHistoryRepository } from "../repositories/stockMovement.repository";
import { prisma } from "../prismaClient";

export const StockMovementService = {
  /**
   * Registrar una compra de stock
   */
  async registerPurchase(data: {
    productId: string;
    quantity: number;
    unitCost: number;
    providerId?: number;
    notes?: string;
  }, userId: string) {
    if (data.quantity <= 0) {
      throw { status: 400, message: "La cantidad debe ser mayor a 0" };
    }

    return prisma.$transaction(async (tx) => {
      // Obtener producto actual
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      });

      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }

      const previousStock = product.stock;
      const newStock = previousStock + data.quantity;

      // Actualizar stock del producto
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newStock }
      });

      // Registrar movimiento
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          movementType: MovementType.PURCHASE,
          quantity: data.quantity,
          previousStock,
          newStock,
          unitCost: data.unitCost,
          providerId: data.providerId,
          notes: data.notes,
          createdBy: userId
        },
        include: {
          product: { select: { name: true, sku: true } },
          provider: { select: { name: true } },
          user: { select: { name: true } }
        }
      });

      return movement;
    });
  },

  /**
   * Enviar producto a reparación o demo
   */
  async registerOutbound(data: {
    productId: string;
    quantity: number;
    movementType: 'REPAIR_OUT' | 'DEMO_OUT';
    reason: string;
    notes?: string;
  }, userId: string) {
    if (data.quantity <= 0) {
      throw { status: 400, message: "La cantidad debe ser mayor a 0" };
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        include: { provider: true }
      });

      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }

      if (product.stock < data.quantity) {
        throw { status: 400, message: "Stock insuficiente" };
      }

      const previousStock = product.stock;
      const newStock = previousStock - data.quantity;

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newStock }
      });
      //Asignar automáticamente el provider id si el producto tiene uno
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          movementType: data.movementType as MovementType,
          quantity: -data.quantity, // Negativo para salidas
          previousStock,
          newStock,
          reason: data.reason,
          notes: data.notes,
          createdBy: userId,
          providerId: product.providerId 
        },
        include: {
          product: { 
            select: { 
              name: true, 
              sku: true,
              provider:{
                select: {
                  id_provider: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          provider: {select:{name: true, id_provider: true} },
          user: { select: { name: true } }
        }
      });

      return movement;
    });
  },

  /**
   * Devolución de venta
   */
  async registerReturn(data: {
    saleId: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }, userId: string) {
    return prisma.$transaction(async (tx) => {
      const movements = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) continue;

        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });

        const movement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: MovementType.RETURN_IN,
            quantity: item.quantity,
            previousStock,
            newStock,
            saleId: data.saleId,
            notes: data.notes,
            createdBy: userId
          },
          include: {
            product: { select: { name: true, sku: true } }
          }
        });

        movements.push(movement);
      }

      return movements;
    });
  },

  /**
   * Listar movimientos con filtros
   */
  async list(filters: {
    productId?: string;
    movementType?: MovementType;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const result = await StockMovementRepository.findAll({
      productId: filters.productId,
      movementType: filters.movementType,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      skip,
      take: limit
    });

    return {
      total: result.total,
      data: result.movements,
      page,
      limit
    };
  },

  /**
   * Historial de un producto específico
   */
  async getProductHistory(productId: string) {
    console.log(`🔍 Buscando historial para producto: ${productId}`);
    const movements = await StockMovementRepository.getProductHistory(productId);
    console.log(`📦 Movimientos encontrados: ${movements.length}`);
    return { data: movements }; // ← Asegurar que devuelve { data: [...] }
  },

  /**
   * Actualizar precios de un producto
   */
  async updatePrices(productId: string, data: {
    costPrice?: number;
    salePrice?: number;
    notes?: string;
  }, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, message: "Producto no encontrado" };
    }

    const updates: any = {};
    const priceChanges = [];

    if (data.costPrice !== undefined && data.costPrice !== product.costPrice) {
      updates.costPrice = data.costPrice;
      priceChanges.push(
        PriceHistoryRepository.create({
          productId,
          oldPrice: product.costPrice,
          newPrice: data.costPrice,
          priceType: 'cost',
          changedBy: userId,
          notes: data.notes || `Cambio de precio de costo: ${product.costPrice} → ${data.costPrice}`
        })
      );
    }

    if (data.salePrice !== undefined && data.salePrice !== product.salePrice) {
      updates.salePrice = data.salePrice;
      priceChanges.push(
        PriceHistoryRepository.create({
          productId,
          oldPrice: product.salePrice,
          newPrice: data.salePrice,
          priceType: 'sale',
          changedBy: userId,
          notes: data.notes || `Cambio de precio de venta: ${product.salePrice} → ${data.salePrice}`
        })
      );
    }

    if (Object.keys(updates).length === 0) {
      throw { status: 400, message: "No hay cambios en los precios" };
    }

    const [updatedProduct] = await Promise.all([
      prisma.product.update({
        where: { id: productId },
        data: updates
      }),
      ...priceChanges
    ]);

    return updatedProduct;
  },

  /**
   * Obtener historial de precios
  */
  async getPriceHistory(productId: string) {
    console.log(`💰 Buscando historial de precios para producto: ${productId}`);
    const history = await PriceHistoryRepository.findAllByProduct(productId);
    console.log(`📈 Registros de precio encontrados: ${history.length}`);

    // Asegurar que devolvemos el formato correcto que espera el frontend
    return { 
      success: true,
      data: history 
    };
  },

  /**
    * Obtener reparaciones activas
    */
  async getActiveRepairs() {
    return prisma.stockMovement.findMany({
      where: {
        movementType: 'REPAIR_OUT',
        isCompleted: false // ← Solo reparaciones no completadas
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, stock: true,
            provider:{
              select: {
                id_provider: true,
                name: true,
                phone: true
              }
            }
          }
        },
        provider: { select: { name: true, id_provider: true } },
        user: {
          select: { name: true, userCode: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
    * Obtener demos activas
  */
  async getActiveDemos() {
    return prisma.stockMovement.findMany({
      where: {
        movementType: 'DEMO_OUT', 
        isCompleted: false // ← Solo demos no completadas
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, stock: true }
        },
        user: {
          select: { name: true, userCode: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
    * Finalizar reparación - Retornar producto al stock
  */
  async completeRepair(repairMovementId: number, data: {
    notes?: string;
    resolution?: string;
  }, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Obtener el movimiento de reparación original
      const repairMovement = await tx.stockMovement.findUnique({
        where: { id: repairMovementId }
      });

      if (!repairMovement) {
        throw { status: 404, message: "Movimiento de reparación no encontrado" };
      }

      // ← NUEVO: Verificar si ya está completado
      if (repairMovement.isCompleted) {
        throw { status: 400, message: "Esta reparación ya fue completada" };
      }

      if (repairMovement.movementType !== 'REPAIR_OUT') {
        throw { status: 400, message: "El movimiento no es de tipo REPAIR_OUT" };
      }

      const product = await tx.product.findUnique({
        where: { id: repairMovement.productId }
      });

      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }

      const quantity = Math.abs(repairMovement.quantity);
      const previousStock = product.stock;
      const newStock = previousStock + quantity;

      // Actualizar stock del producto
      await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock }
      });

      // ← NUEVO: Marcar el movimiento original como completado
      await tx.stockMovement.update({
        where: { id: repairMovementId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId
        }
      });

      // Registrar el movimiento de retorno
      const returnMovement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          movementType: 'REPAIR_RETURN',
          quantity: quantity,
          previousStock,
          newStock,
          notes: data.notes,
          reason: data.resolution || 'Reparación completada',
          createdBy: userId,
          isCompleted: true // ← El retorno se marca como completado inmediatamente
        },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } }
        }
      });

      return returnMovement;
    });
  },
  /**
    * Finalizar demo - Retornar producto al stock
  */
  async completeDemo(demoMovementId: number, data: {
    notes?: string;
    resolution?: string;
  }, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Obtener el movimiento de reparación original
      const demoMovement = await tx.stockMovement.findUnique({
        where: { id: demoMovementId }
      });
    
      if (!demoMovement) {
        throw { status: 404, message: "Movimiento de reparación no encontrado" };
      }
    
      // ← NUEVO: Verificar si ya está completado
      if (demoMovement.isCompleted) {
        throw { status: 400, message: "Esta reparación ya fue completada" };
      }
    
      if (demoMovement.movementType !== 'DEMO_OUT') {
        throw { status: 400, message: "El movimiento no es de tipo DEMO_OUT" };
      }
    
      const product = await tx.product.findUnique({
        where: { id: demoMovement.productId }
      });
    
      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }
    
      const quantity = Math.abs(demoMovement.quantity);
      const previousStock = product.stock;
      const newStock = previousStock + quantity;
    
      // Actualizar stock del producto
      await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock }
      });
    
      // ← NUEVO: Marcar el movimiento original como completado
      await tx.stockMovement.update({
        where: { id: demoMovementId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId
        }
      });
    
      // Registrar el movimiento de retorno
      const returnMovement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          movementType: 'DEMO_RETURN',
          quantity: quantity,
          previousStock,
          newStock,
          notes: data.notes,
          reason: data.resolution || 'Reparación completada',
          createdBy: userId,
          isCompleted: true // ← El retorno se marca como completado inmediatamente
        },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } }
        }
      });
    
      return returnMovement;
    });
  },
};