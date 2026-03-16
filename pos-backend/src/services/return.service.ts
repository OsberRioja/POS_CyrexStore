import { PrismaClient, ReturnStatus, MovementType } from "@prisma/client";
import { ReturnRepository } from "../repositories/return.repository";
import { CreateReturnDTO } from "../dtos/return.dto";
import { RETURN_POLICY } from "../config/returnPolicy";

const prisma = new PrismaClient();

export const ReturnService = {
  async createReturn(dto: CreateReturnDTO, actorUserId: string) {
    // Validar que la venta exista y no sea muy antigua
    const sale = await prisma.sale.findUnique({
      where: { id: dto.saleId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw { status: 404, message: "Venta no encontrada" };
    }

    // Verificar si ya existe una devolución para esta venta
    const existingReturn = await prisma.return.findFirst({
      where: {
        saleId: dto.saleId,
        status: {
          in: ['PENDING', 'APPROVED', 'COMPLETED'] // no se incluye REJECTED
        }
      }
    });

    if (existingReturn) {
      throw {
        status: 400,
        message: `Esta venta ya tiene una devolución registrada (ID: ${existingReturn.id}). No se permiten múltiples devoluciones por venta.`
      };
    }

    // Validar política de días
    const saleDate = new Date(sale.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > RETURN_POLICY.maxDaysForReturn) {
      throw { status: 400, message: `La venta tiene ${daysDiff} días, no se puede devolver (máximo ${RETURN_POLICY.maxDaysForReturn} días)` };
    }

    // Validar que hay una caja abierta
    const openCashBox = await prisma.cashBox.findFirst({
      where: { status: 'OPEN' }
    });

    if (!openCashBox) {
      throw { status: 400, message: "No se puede procesar la devolución porque no hay una caja abierta" };
    }

    // Validar que los items a devolver existen en la venta y las cantidades no exceden
    const saleItemsMap = new Map();
    sale.items.forEach(item => {
      saleItemsMap.set(item.productId, item);
    });

    let totalRefunded = 0;
    for (const returnItem of dto.items) {
      const saleItem = saleItemsMap.get(returnItem.productId);
      if (!saleItem) {
        throw { status: 400, message: `El producto ${returnItem.productId} no está en la venta` };
      }
      if (returnItem.quantityReturned > saleItem.quantity) {
        throw { status: 400, message: `La cantidad a devolver (${returnItem.quantityReturned}) excede la cantidad vendida (${saleItem.quantity}) para el producto ${saleItem.product.name}` };
      }
      // Calcular subtotal y total
      totalRefunded += returnItem.quantityReturned * returnItem.unitPrice;
    }

    // Si requiere aprobación, el estado es PENDING, de lo contrario APPROVED
    let status: ReturnStatus = ReturnStatus.PENDING;
    if (!RETURN_POLICY.requiresApproval) {
      status = ReturnStatus.APPROVED;
    }

    // Crear la devolución
    const returnData = {
      saleId: dto.saleId,
      reason: dto.reason,
      approvedBy: actorUserId,
      totalRefunded,
      refundMethod: dto.refundMethod,
      notes: dto.notes,
      status,
      items: dto.items.map(item => ({
        productId: item.productId,
        quantityReturned: item.quantityReturned,
        unitPrice: item.unitPrice,
        subtotal: item.quantityReturned * item.unitPrice,
        condition: item.condition,
      })),
    };

    const returnRecord = await ReturnRepository.create(returnData);

    // Si no requiere aprobación o si ya está aprobado, procesar inmediatamente
    if (status === ReturnStatus.APPROVED) {
      await this.processReturn(returnRecord.id, actorUserId);
    }

    return returnRecord;
  },

  async processReturn(returnId: number, actorUserId: string) {
    return await prisma.$transaction(async (tx) => {
      const returnRecord = await tx.return.findUnique({
        where: { id: returnId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!returnRecord) {
        throw { status: 404, message: "Devolución no encontrada" };
      }

      if (returnRecord.status !== ReturnStatus.APPROVED) {
        throw { status: 400, message: "La devolución no está aprobada" };
      }


      // Incrementar stock y registrar movimientos
      for (const item of returnRecord.items) {
        const product = item.product;
        const newStock = product.stock + item.quantityReturned;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: MovementType.RETURN_IN,
            quantity: item.quantityReturned,
            previousStock: product.stock,
            newStock: newStock,
            returnId: returnRecord.id,
            createdBy: actorUserId,
          },
        });
      }

      // Actualizar estado de la devolución a COMPLETED
      const updatedReturn = await tx.return.update({
        where: { id: returnId },
        data: { status: ReturnStatus.COMPLETED },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
          sale: {
            include: {
              client: true,
              seller: {
                select: {
                  name: true,
                  userCode: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              userCode: true,
            },
          },
        },
      });

      return updatedReturn;
    });
  },

  async approveReturn(returnId: number, actorUserId: string) {
    const returnRecord = await ReturnRepository.findById(returnId);
    if (!returnRecord) {
      throw { status: 404, message: "Devolución no encontrada" };
    }

    // Solo ADMIN o SUPERVISOR pueden aprobar
    const user = await prisma.user.findUnique({ where: { id: actorUserId } });
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERVISOR') {
      throw { status: 403, message: "No tienes permisos para aprobar devoluciones" };
    }

    // Verificar que hay una caja abierta
    const openCashBox = await prisma.cashBox.findFirst({
      where: { status: 'OPEN' }
    });

    if (!openCashBox) {
      throw { status: 400, message: "No se puede aprobar la devolución porque no hay una caja abierta" };
    }

    // Actualizar estado a APPROVED
    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.APPROVED,
      },
    });

    // Procesar la devolución (devolver stock, etc.)
    await this.processReturn(returnId, actorUserId);

    return updatedReturn;
  },

  async getReturnById(id: number) {
    const returnRecord = await ReturnRepository.findById(id);
    if (!returnRecord) {
      throw { status: 404, message: "Devolución no encontrada" };
    }
    return returnRecord;
  },

  async listReturns(params: { page?: number; limit?: number; saleId?: string }) {
    return ReturnRepository.list(params);
  },
};