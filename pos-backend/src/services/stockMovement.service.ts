import { MovementType, ProductSerialStatus } from "@prisma/client";
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
    serialNumbers?: string[];
  }, userId: string) {
    if (data.quantity <= 0) {
      throw { status: 400, message: "La cantidad debe ser mayor a 0" };
    }

    const cleanedSerialNumbers = (data.serialNumbers ?? [])
      .map((serial) => String(serial).trim())
      .filter(Boolean);

    if (cleanedSerialNumbers.length !== data.quantity) {
      throw {
        status: 400,
        message: "Debe registrar exactamente un número de serie por cada unidad comprada"
      };
    }

    if (new Set(cleanedSerialNumbers).size !== cleanedSerialNumbers.length) {
      throw {
        status: 400,
        message: "Los números de serie no pueden repetirse dentro de la misma compra"
      };
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      });

      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }

      const existingSerials = await tx.productSerial.findMany({
        where: { serialNumber: { in: cleanedSerialNumbers } },
        select: { serialNumber: true }
      });

      if (existingSerials.length > 0) {
        throw {
          status: 400,
          message: `Los siguientes números de serie ya existen: ${existingSerials.map((item: { serialNumber: string }) => item.serialNumber).join(', ')}`
        };
      }

      const previousStock = product.stock;
      const newStock = previousStock + data.quantity;

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newStock }
      });

      await tx.productSerial.createMany({
        data: cleanedSerialNumbers.map((serialNumber) => ({
          productId: data.productId,
          serialNumber,
          status: ProductSerialStatus.AVAILABLE,
          unitCost: data.unitCost,
          providerId: data.providerId
        }))
      });

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
          serialNumbers: cleanedSerialNumbers,
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

  async getAvailableSerials(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) {
      throw { status: 404, message: "Producto no encontrado" };
    }

    return prisma.productSerial.findMany({
      where: {
        productId,
        status: ProductSerialStatus.AVAILABLE
      },
      orderBy: { serialNumber: 'asc' },
      select: {
        id: true,
        serialNumber: true,
        purchasedAt: true,
        unitCost: true
      }
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
    saleId?: string;
    branchId?: number;
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
      take: limit,
      saleId: filters.saleId,
      branchId: filters.branchId
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
  async getProductHistory(productId: string, branchId?: number) {
    const movements = await StockMovementRepository.getProductHistory(productId, branchId);
    // Verificar si se encontraron movimientos
    if (movements.length === 0) {
      console.log(`⚠️ No se encontraron movimientos para el producto ${productId} en la sucursal ${branchId}`);
    } else {
      console.log(`📦 Movimientos encontrados: ${movements.length}`);
    }

    return { 
      success: true,
      data: movements,
      message: movements.length === 0 ? 
        `No se encontraron movimientos para este producto${branchId ? ' en la sucursal especificada' : ''}` : 
        `${movements.length} movimientos encontrados`
    };
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
  async getActiveRepairs(branchId?: number) {
    const where: any = {
      movementType: 'REPAIR_OUT',
      isCompleted: false
    };

    // Filtrar por branchId si se proporciona
    if (branchId !== undefined) {
      where.product = {
        branchId: branchId
      };
    }

    return prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true, 
            stock: true,
            branchId: true,
            provider: {
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
  async getActiveDemos(branchId?: number) {
    const where: any = {
      movementType: 'DEMO_OUT', 
      isCompleted: false
    };

    // Filtrar por branchId si se proporciona
    if (branchId !== undefined) {
      where.product = {
        branchId: branchId
      };
    }

    return prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true, 
            stock: true,
            branchId: true
          }
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
  /**
   * Registrar ajuste manual de stock
   */
  async registerAdjustment(data: {
    productId: string;
    quantity: number; // Positivo para aumento, negativo para disminución
    reason: string; // Justificación obligatoria
    notes?: string;
  }, userId: string) {
    if (data.quantity === 0) {
      throw { status: 400, message: "La cantidad no puede ser 0" };
    }
  
    if (!data.reason || data.reason.trim() === '') {
      throw { status: 400, message: "La razón/justificación es obligatoria" };
    }
  
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      });
    
      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }
    
      const previousStock = product.stock;
      const newStock = previousStock + data.quantity;
    
      // Validar que el stock no sea negativo después del ajuste
      if (newStock < 0) {
        throw { 
          status: 400, 
          message: `Stock insuficiente. Stock actual: ${previousStock}, ajuste: ${data.quantity}` 
        };
      }
    
      // Actualizar stock del producto
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newStock }
      });
    
      // Registrar movimiento de ajuste
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          movementType: 'ADJUSTMENT',
          quantity: data.quantity,
          previousStock,
          newStock,
          reason: data.reason,
          notes: data.notes,
          createdBy: userId,
        },
        include: {
          product: { 
            select: { 
              name: true, 
              sku: true,
              branch: {
                select: { name: true }
              }
            } 
          },
          user: { select: { name: true, userCode: true } }
        }
      });
    
      return movement;
    });
  },
  
  /**
   * Registrar salida por uso interno
   */
  async registerInternalUseOut(data: {
    productId: string;
    quantity: number;
    reason: string;
    destination?: string;
    expectedReturnDate?: Date;
    notes?: string;
  }, userId: string) {
    if (data.quantity <= 0) {
      throw { status: 400, message: "La cantidad debe ser mayor a 0" };
    }
  
    if (!data.reason || data.reason.trim() === '') {
      throw { status: 400, message: "La razón/justificación es obligatoria" };
    }
  
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      });
    
      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }
    
      if (product.stock < data.quantity) {
        throw { status: 400, message: "Stock insuficiente" };
      }
    
      const previousStock = product.stock;
      const newStock = previousStock - data.quantity;
    
      // Actualizar stock del producto
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newStock }
      });
    
      // Registrar movimiento de salida por uso interno
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          movementType: 'INTERNAL_USE_OUT',
          quantity: -data.quantity, // Negativo para salidas
          previousStock,
          newStock,
          reason: data.reason,
          notes: data.notes,
          destination: data.destination,
          expectedReturnDate: data.expectedReturnDate,
          createdBy: userId,
          isCompleted: false // ← Para poder rastrear si fue devuelto
        },
        include: {
          product: { 
            select: { 
              name: true, 
              sku: true,
              branch: {
                select: { name: true }
              }
            } 
          },
          user: { select: { name: true, userCode: true } }
        }
      });
    
      return movement;
    });
  },
  
  /**
   * Obtener usos internos activos
   */
  async getActiveInternalUses(branchId?: number) {
    const where: any = {
      movementType: 'INTERNAL_USE_OUT',
      isCompleted: false
    };
  
    if (branchId !== undefined) {
      where.product = {
        branchId: branchId
      };
    }
  
    return prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true, 
            stock: true,
            branchId: true,
            branch: {
              select: { name: true }
            }
          }
        },
        user: {
          select: { name: true, userCode: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  
  /**
   * Retornar producto de uso interno
   */
  async returnInternalUse(internalUseMovementId: number, data: {
    notes?: string;
    condition?: string;
  }, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Obtener el movimiento original de uso interno
      const internalUseMovement = await tx.stockMovement.findUnique({
        where: { id: internalUseMovementId }
      });
    
      if (!internalUseMovement) {
        throw { status: 404, message: "Movimiento de uso interno no encontrado" };
      }
    
      if (internalUseMovement.movementType !== 'INTERNAL_USE_OUT') {
        throw { status: 400, message: "El movimiento no es de tipo INTERNAL_USE_OUT" };
      }
    
      if (internalUseMovement.isCompleted) {
        throw { status: 400, message: "Este uso interno ya fue devuelto" };
      }
    
      const product = await tx.product.findUnique({
        where: { id: internalUseMovement.productId }
      });
    
      if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
      }
    
      const quantity = Math.abs(internalUseMovement.quantity);
      const previousStock = product.stock;
      const newStock = previousStock + quantity;
    
      // Actualizar stock del producto
      await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock }
      });
    
      // Marcar el movimiento original como completado
      await tx.stockMovement.update({
        where: { id: internalUseMovementId },
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
          movementType: 'INTERNAL_USE_RETURN',
          quantity: quantity,
          previousStock,
          newStock,
          notes: data.notes,
          reason: data.condition || 'Producto devuelto de uso interno',
          createdBy: userId,
          isCompleted: true
        },
        include: {
          product: { 
            select: { 
              name: true, 
              sku: true,
              branch: {
                select: { name: true }
              }
            } 
          },
          user: { select: { name: true } }
        }
      });
    
      return returnMovement;
    });
  }
};