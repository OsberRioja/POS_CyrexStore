// src/services/sale.service.ts
import { PrismaClient, PaymentStatus } from "@prisma/client";
import { SaleRepository } from "../repositories/sale.repository";
import type { CreateSaleDTO, SaleItemDTO, SalePaymentDTO, AddPaymentDTO } from "../dtos/sale.dto";
import { CashBoxRepository } from "../repositories/cashBox.repository";
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";

const prisma = new PrismaClient();

export const SaleService = {
  /**
   * Función helper para calcular estado de pago
   */
  calculatePaymentStatus(total: number, totalPaid: number): PaymentStatus {
    if (totalPaid <= 0) return PaymentStatus.PENDING;
    if (Math.abs(totalPaid - total) < 0.01) return PaymentStatus.PAID; // considerando precisión decimal
    if (totalPaid > total) return PaymentStatus.OVERPAID;
    return PaymentStatus.PARTIAL;
  },

  /**
   * Crea una venta completa en transacción:
   * - valida productos / stock
   * - CORREGIDO: usa unitPrice del frontend (ya convertido a BOB)
   * - permite pagos parciales si allowPartialPayment = true
   * - asigna cashBoxId a pagos en efectivo si hay caja abierta
   * - decrementa stock de productos
   */
  async createSale(dto: any, actorUserId: string) {
    // Validaciones iniciales
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw { status: 400, message: "items es requerido" };
    }
    if (!dto.payments || !Array.isArray(dto.payments) || dto.payments.length === 0) {
      throw { status: 400, message: "payments es requerido" };
    }

    // Resolver sellerId (por userCode o id, fallback actor)
    let sellerId = dto.sellerId ?? null;
    if (!sellerId && dto.sellerUserCode) {
      const user = await prisma.user.findFirst({ where: { userCode: dto.sellerUserCode } as any });
      if (!user) throw { status: 404, message: "Vendedor no encontrado por userCode" };
      sellerId = user.id;
    }
    if (!sellerId) sellerId = actorUserId;

    // comprobar que haya caja abierta (regla)
    const openBox = await CashBoxRepository.findOpen();
    if (!openBox) {
      throw { status: 400, message: "Debe abrir caja antes de registrar ventas" };
    }

    // Validar items y preparar itemsData
    const itemsData: Array<any> = [];
    for (const it of dto.items) {
      if (!it.productId) throw { status: 400, message: "Cada item debe tener productId" };
      const quantity = Number(it.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) throw { status: 400, message: "quantity inválida para un item" };
      
      // ✅ CRÍTICO: Validar que unitPrice venga del frontend
      const unitPrice = Number(it.unitPrice);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw { status: 400, message: "unitPrice inválido para un item" };
      }
      
      itemsData.push({ 
        productId: String(it.productId), 
        quantity, 
        unitPrice // ← Usar el precio que viene del frontend (ya convertido a BOB)
      });
    }

    // Validar payments
    const paymentsDto = dto.payments;
    if (!paymentsDto || paymentsDto.length === 0) throw { status: 400, message: "Debe incluir al menos un payment" };
    for (const p of paymentsDto) {
      if (!p.paymentMethodId || Number.isNaN(Number(p.amount))) {
        throw { status: 400, message: "Cada payment debe incluir paymentMethodId y amount válidos" };
      }
      if (Number(p.amount) < 0) {
        throw { status: 400, message: "Los montos de pago no pueden ser negativos" };
      }
    }

    // calcular total (desde itemsData usando unitPrice * qty)
    const totalPaid = paymentsDto.reduce((s: number, p: any) => s + Number(p.amount), 0);

    // NUEVA VALIDACIÓN: Permitir pagos parciales con flag explícito
    if (totalPaid < 0) {
      throw { status: 400, message: 'El monto pagado no puede ser negativo' };
    }

    // Reglas sobre cliente: obligamos a que venga dto.client
    if (!dto.client) {
      throw { status: 400, message: "Debe seleccionar un cliente (client.id_cliente) para registrar la venta" };
    }

    // Transacción principal
    return await prisma.$transaction(async (tx) => {
      // 0) Resolver / crear cliente:
      let clientId: number | null = null;

      // Si client viene como número o string con dígitos
      if (typeof dto.client === "number" || (typeof dto.client === "string" && /^\d+$/.test(dto.client))) {
        clientId = Number(dto.client);
        const exists = await tx.cliente.findUnique({ where: { id_cliente: clientId } });
        if (!exists) throw { status: 400, message: `Cliente ${clientId} no existe` };
      } else if (typeof dto.client === "object") {

        // Si trae id_cliente en el objeto, usarlo
        if (dto.client.id_cliente || dto.client.id) {
          clientId = Number(dto.client.id_cliente ?? dto.client.id);
          const exists = await tx.cliente.findUnique({ where: { id_cliente: clientId } });
          if (!exists) throw { status: 400, message: `Cliente ${clientId} no existe` };
        } else {

          // objeto sin id -> crear solo si trae nombre válido
          const nombre = typeof dto.client.nombre === "string" ? dto.client.nombre.trim() : "";
          if (!nombre) {
            throw { status: 400, message: "Si envia client sin id, debe incluir client.nombre para crear cliente" };
          }
          const tipo_cliente = dto.client.tipoCliente === "EMPRESA" ? "EMPRESA" : "PERSONA";
          const telefono = dto.client.telefono ? String(dto.client.telefono) : "";
          const genero = dto.client.genero ? String(dto.client.genero) : null;
          const fecha_nacimiento = dto.client.fecha_nacimiento ? new Date(dto.client.fecha_nacimiento) : null;

          const createdClient = await tx.cliente.create({
            data: {
              nombre,
              tipo_cliente,
              telefono,
              genero,
              fecha_nacimiento,
            },
          });
          clientId = createdClient.id_cliente;
        }
      } else {
        throw { status: 400, message: "Formato de client inválido" };
      }

      // ✅ 1) CORRECCIÓN: Validar productos pero USAR unitPrice del frontend
      const itemsToCreate: any[] = [];
      let calculatedTotal = 0;

      for (const it of itemsData) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw { status: 404, message: `Producto ${it.productId} no encontrado` };
        if (product.stock < it.quantity) throw { status: 400, message: `Stock insuficiente para producto ${product.name}` };

        // ✅ CORRECCIÓN: Usar el unitPrice que viene del frontend (ya convertido a BOB)
        const unitPrice = Number(it.unitPrice);
        const subtotal = unitPrice * Number(it.quantity);
        calculatedTotal += subtotal;
        
        itemsToCreate.push({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice, //usa el precio del frontend
          subtotal,
        });
      }
      
      let adjustedPayments = [...paymentsDto];
      let netCashAmount = totalPaid;

      if (totalPaid > calculatedTotal) {
        const change = totalPaid - calculatedTotal;
        netCashAmount = calculatedTotal; // solo se considera hasta el total de la venta

        //buscar pagos en efectivo para ajustarlos
        const cashPaymentIndex = adjustedPayments.findIndex(async (p) => {
          const method = await PaymentMethodRepository.findById(p.paymentMethodId);
          return method && (method as any).isCash;
        });
        
        if (cashPaymentIndex >= 0) {
          // ajustar el pago en efectivo al monto neto
          adjustedPayments[cashPaymentIndex].amount = netCashAmount;
        }
        
      }

      // Si el pago es menor al total, validar que se permita pago parcial
      if (totalPaid < calculatedTotal && !dto.allowPartialPayment) {
        throw { 
          status: 400, 
          message: `Suma de payments (${totalPaid}) no coincide con total calculado (${calculatedTotal}). Use allowPartialPayment=true para crear un anticipo.` 
        };
      }

      // 2) preparar paymentsData (y verificar métodos)
      const paymentsData: any[] = [];
      for (const p of adjustedPayments) {
        const pm = await tx.paymentMethod.findUnique({ where: { id: p.paymentMethodId } });
        if (!pm) throw { status: 404, message: `Método de pago ${p.paymentMethodId} no encontrado` };
        const isCash = !!(pm as any).isCash;
        paymentsData.push({
          paymentMethodId: Number(p.paymentMethodId),
          amount: Number(p.amount),
          cashBoxId: isCash ? openBox.id : undefined,
        });
      }
      
      // Calcular saldo y estado
      const balance = Math.max(0, calculatedTotal - netCashAmount);
      const paymentStatus = this.calculatePaymentStatus(calculatedTotal, netCashAmount);

      // 3) crear venta con nested items y payments
      const created = await tx.sale.create({
        data: {
          sellerId: String(sellerId),
          clientId: clientId ?? undefined,
          total: Number(calculatedTotal.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          balance: Number(balance.toFixed(2)),
          paymentStatus: paymentStatus,
          createdBy: dto.createdBy ?? actorUserId,
          cashBoxId: openBox.id,
          items: { create: itemsToCreate },
          payments: { create: paymentsData },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: { 
            include: { 
              paymentMethod: {
                select: {
                  name: true,
                  isCash: true
                }
              }
            } 
          },
          seller: {
            select: {
              name: true,
              userCode: true
            }
          },
          client: true
        },
      });

      // 4) Decrementar stock y registrar movimientos
      for (const item of itemsToCreate) {
        // Obtener el stock ANTES de decrementar
        const productBefore = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true }
        });
      
        if (!productBefore) {
          throw { status: 404, message: `Producto ${item.productId} no encontrado` };
        }
      
        const previousStock = productBefore.stock;
        const newStock = previousStock - item.quantity;
      
        // Decrementar el stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: Number(item.quantity) } },
        });
      
        // Registrar el movimiento con los valores correctos
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: 'SALE',
            quantity: -item.quantity, // Negativo porque es una salida
            previousStock: previousStock,
            newStock: newStock,
            saleId: created.id,
            createdBy: actorUserId
          }
        });
      }
      return created;
    });
  },
  
  /**
   * NUEVO: Método para completar un pago pendiente
   */
  async addPayment(addPaymentDto: AddPaymentDTO, actorUserId: string) {
    return await prisma.$transaction(async (tx) => {
      // Obtener la venta actual
      const sale = await tx.sale.findUnique({
        where: { id: addPaymentDto.saleId },
        include: { payments: true }
      });

      if (!sale) {
        throw { status: 404, message: 'Venta no encontrada' };
      }

      if (sale.paymentStatus === PaymentStatus.PAID) {
        throw { status: 400, message: 'Esta venta ya está completamente pagada' };
      }

      // Validar que el nuevo pago no exceda el saldo
      const newPaymentAmount = Number(addPaymentDto.amount);
      if (newPaymentAmount > sale.balance) {
        throw { status: 400, message: `El pago (${newPaymentAmount}) excede el saldo pendiente (${sale.balance})` };
      }

      if (newPaymentAmount <= 0) {
        throw { status: 400, message: 'El monto del pago debe ser positivo' };
      }

      // Verificar método de pago
      const paymentMethod = await tx.paymentMethod.findUnique({
        where: { id: addPaymentDto.paymentMethodId }
      });
      
      if (!paymentMethod) {
        throw { status: 404, message: 'Método de pago no encontrado' };
      }

      // Determinar cashBoxId para pagos en efectivo
      let cashBoxId = null;
      if ((paymentMethod as any).isCash) {
        if (addPaymentDto.cashBoxId) {
          cashBoxId = addPaymentDto.cashBoxId;
        } else {
          const openBox = await CashBoxRepository.findOpen();
          if (!openBox) {
            throw { status: 400, message: 'Debe tener una caja abierta para pagos en efectivo' };
          }
          cashBoxId = openBox.id;
        }
      }

      // Agregar el nuevo pago
      await tx.salePayment.create({
        data: {
          saleId: sale.id,
          paymentMethodId: addPaymentDto.paymentMethodId,
          amount: newPaymentAmount,
          cashBoxId: cashBoxId,
        }
      });

      // Actualizar totales y estado de la venta
      const newTotalPaid = sale.totalPaid + newPaymentAmount;
      const newBalance = sale.total - newTotalPaid;
      const newPaymentStatus = this.calculatePaymentStatus(sale.total, newTotalPaid);

      const updatedSale = await tx.sale.update({
        where: { id: addPaymentDto.saleId },
        data: {
          totalPaid: Number(newTotalPaid.toFixed(2)),
          balance: Number(newBalance.toFixed(2)),
          paymentStatus: newPaymentStatus,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: {
            include: {
              paymentMethod: {
                select: {
                  name: true,
                  isCash: true
                }
              }
            }
          },
          seller: {
            select: {
              name: true,
              userCode: true
            }
          },
          client: true
        }
      });

      return updatedSale;
    });
  },

  async list(params: {
    page?: number;
    limit?: number;
    sellerId?: string;
    cashBoxId?: number;
    dateFrom?: string;
    dateTo?: string;
    paymentStatus?: PaymentStatus;
  }) {
    return SaleRepository.findAll(params);
  },

  async getById(id: string) {
    const s = await SaleRepository.findById(id);
    if (!s) throw { status: 404, message: "Venta no encontrada" };
    return s;
  },

  async findByBox(cashBoxId: number) {
    const sales = await SaleRepository.findByBox(cashBoxId);
    return sales;
  },

  /**
   * NUEVO: Obtener ventas con saldo pendiente
   */
  async findPendingSales(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = params;
    
    const where = {
      OR: [
        { paymentStatus: PaymentStatus.PENDING },
        { paymentStatus: PaymentStatus.PARTIAL }
      ]
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          client: true,
          seller: { select: { name: true, userCode: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
          payments: { include: { paymentMethod: { select: { name: true, isCash: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where })
    ]);

    return { data: sales, total, page, limit };
  }
};