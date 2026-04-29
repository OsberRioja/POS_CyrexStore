// src/services/sale.service.ts
import { PrismaClient, PaymentStatus, ProductSerialStatus } from "@prisma/client";
import { SaleRepository } from "../repositories/sale.repository";
import type { AddPaymentDTO } from "../dtos/sale.dto";
import { CashBoxRepository } from "../repositories/cashBox.repository";
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";
import { CommissionCalculationService } from "./commissionCalculation.service";
import  { ExchangeRateService }  from "./exchangeRate.service";
import { normalizeCountryCode, normalizePhoneNumber } from "../utils/phone";

const prisma = new PrismaClient();

export const SaleService = {
  round2(value: number): number {
    return Math.round(value * 100) / 100;
  },
  calculateDiscount(subtotal: number, discountType?: "PERCENTAGE" | "FIXED" | null, discountValue?: number | null, discountAmount?: number | null): number {
    if ((!discountType || discountValue == null) && discountAmount != null) {
      const amount = Number(discountAmount);
      if (Number.isNaN(amount) || amount < 0) throw { status: 400, message: "Monto de descuento inválido" };
      return this.round2(amount);
    }
    if (!discountType || discountValue == null) return 0;
    const value = Number(discountValue);
    if (Number.isNaN(value)) throw { status: 400, message: "Valor de descuento inválido" };
    if (discountType === "PERCENTAGE") {
      if (value < 0 || value > 100) throw { status: 400, message: "El descuento porcentual debe estar entre 0 y 100" };
      return this.round2((subtotal * value) / 100);
    }
    if (discountType === "FIXED") {
      if (value < 0) throw { status: 400, message: "El descuento fijo no puede ser negativo" };
      return this.round2(value);
    }
    throw { status: 400, message: "Tipo de descuento inválido" };
  },
  async attachCreatedBy<T extends { createdBy?: string | null }>(sales: T | T[]) {
    const list = Array.isArray(sales) ? sales : [sales];
    const ids = [...new Set(list.map((s) => s.createdBy).filter(Boolean) as string[])];
    if (ids.length === 0) return sales as any;
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, userCode: true } });
    const map = new Map(users.map((u) => [u.id, u]));
    const mapped = list.map((s: any) => ({ ...s, createdBy: s.createdBy ? (map.get(s.createdBy) ?? null) : null }));
    return (Array.isArray(sales) ? mapped : mapped[0]) as any;
  },
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
  async createSale(dto: any, actorUserId: string, branchId: number) {
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
      const user = await prisma.user.findFirst({ where: { userCode: dto.sellerUserCode, deleted: false }  });
      if (!user) throw { status: 404, message: "Vendedor no encontrado por userCode" };
      sellerId = user.id;
    }
    if (!sellerId) sellerId = actorUserId;
    const sellerExists = await prisma.user.findFirst({ where: { id: sellerId, deleted: false } });
    if (!sellerExists) throw { status: 404, message: "sellerId no existe" };

    // comprobar que haya caja abierta en la misma sucursal(regla)
    const openBox = await CashBoxRepository.findOpenByBranch(branchId);
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
      
      const serialNumbers = Array.isArray(it.serialNumbers)
        ? it.serialNumbers.map((serial: string) => String(serial).trim()).filter(Boolean)
        : [];

      if (serialNumbers.length !== quantity) {
        throw {
          status: 400,
          message: "Debe seleccionar exactamente un número de serie por cada unidad vendida"
        };
      }

      if (new Set(serialNumbers).size !== serialNumbers.length) {
        throw {
          status: 400,
          message: "Los números de serie no pueden repetirse dentro del mismo item de venta"
        };
      }

      itemsData.push({ 
        productId: String(it.productId), 
        quantity, 
        unitPrice, // ← Usar el precio que viene del frontend (ya convertido a BOB)
        originalPrice: Number(it.originalPrice) || unitPrice, // Precio en moneda original
        originalCurrency: it.originalCurrency || 'BOB', // Moneda Original
        conversionRate: Number(it.conversionRate) || 1, // Tasa de cambio
        discountType: it.discountType ?? null,
        discountValue: it.discountValue ?? null,
        discountAmount: it.discountAmount ?? null,
        serialNumbers
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
          const normalizedPhone = normalizePhoneNumber(dto.client.phone ?? dto.client.telefono ?? "");
          const countryCode = normalizeCountryCode(dto.client.countryCode ?? "591");
          const country = String(dto.client.country ?? "Bolivia");
          const genero = dto.client.genero ? String(dto.client.genero) : null;
          const fecha_nacimiento = dto.client.fecha_nacimiento ? new Date(dto.client.fecha_nacimiento) : null;

          const createdClient = await tx.cliente.create({
            data: {
              nombre,
              tipo_cliente,
              countryCode,
              country,
              phone: normalizedPhone,
              telefono: normalizedPhone,
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
      let saleSubtotal = 0;
      let itemsDiscountTotal = 0;

      const allSerialNumbers = itemsData.flatMap((item) => item.serialNumbers);
      if (new Set(allSerialNumbers).size !== allSerialNumbers.length) {
        throw { status: 400, message: "No puede vender el mismo número de serie más de una vez en la misma venta" };
      }

      for (const it of itemsData) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw { status: 404, message: `Producto ${it.productId} no encontrado` };
        if (product.stock < it.quantity) throw { status: 400, message: `Stock insuficiente para producto ${product.name}` };

        const availableSerials = await tx.productSerial.findMany({
          where: {
            productId: it.productId,
            serialNumber: { in: it.serialNumbers },
            status: ProductSerialStatus.AVAILABLE
          },
          select: { serialNumber: true }
        });

        if (availableSerials.length !== it.serialNumbers.length) {
          const found = new Set(availableSerials.map((item: { serialNumber: string }) => item.serialNumber));
          const missing = it.serialNumbers.filter((serial: string) => !found.has(serial));
          throw {
            status: 400,
            message: `Los siguientes números de serie no están disponibles para ${product.name}: ${missing.join(', ')}`
          };
        }

        const activeBlockedMovements = await tx.stockMovement.findMany({
          where: {
            movementType: {
              in: ['REPAIR_OUT', 'DEMO_OUT', 'INTERNAL_USE_OUT']
            },
            isCompleted: false,
            serialNumbers: {
              hasSome: it.serialNumbers
            }
          },
          select: {
            movementType: true,
            serialNumbers: true
          }
        });

        if (activeBlockedMovements.length > 0) {
          const blockedBySerial = new Map<string, string>();

          for (const movement of activeBlockedMovements) {
            for (const serial of movement.serialNumbers) {
              if (it.serialNumbers.includes(serial) && !blockedBySerial.has(serial)) {
                blockedBySerial.set(serial, movement.movementType);
              }
            }
          }

          if (blockedBySerial.size > 0) {
            const details = Array.from(blockedBySerial.entries())
              .map(([serial, movementType]) => `${serial} (${movementType})`)
              .join(', ');

            throw {
              status: 400,
              message: `No puede vender series con movimientos activos: ${details}`
            };
          }
        }

        const unitPrice = Number(it.unitPrice);
        const subtotal = this.round2(unitPrice * Number(it.quantity));
        const discountAmountRaw = this.calculateDiscount(subtotal, it.discountType, it.discountValue, it.discountAmount);
        if (discountAmountRaw > subtotal) {
          throw { status: 400, message: `El descuento del item ${product.name} no puede ser mayor al subtotal` };
        }
        const discountAmount = this.round2(Math.min(discountAmountRaw, subtotal));
        const finalSubtotal = this.round2(Math.max(0, subtotal - discountAmount));
        saleSubtotal += subtotal;
        itemsDiscountTotal += discountAmount;

        let conversionRate = 1;
        const originalPrice = it.originalPrice;
        const originalCurrency = it.originalCurrency || 'BOB';

        if (product.priceCurrency !== 'BOB') {
          if (originalPrice && originalPrice > 0 && originalCurrency !== 'BOB') {
            conversionRate = unitPrice / originalPrice;
          } else {
            try {
              conversionRate = await ExchangeRateService.getRate(product.priceCurrency, 'BOB');
            } catch (error) {
              console.error(`Error obteniendo tasa para ${product.priceCurrency}:`, error);
              conversionRate = 1;
            }
          }
        }
        
        itemsToCreate.push({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice,
          subtotal: finalSubtotal,
          discountType: it.discountType ?? null,
          discountValue: it.discountValue ?? null,
          discountAmount,
          originalPrice: it.originalPrice,
          originalCurrency: it.originalCurrency,
          conversionRate: conversionRate,
          serialNumbers: it.serialNumbers
        });
      }
      
      let adjustedPayments = [...paymentsDto];
      let netCashAmount = totalPaid;

      const subtotalAfterItemsDiscount = this.round2(Math.max(0, saleSubtotal - itemsDiscountTotal));
      const globalDiscountAmountRaw = this.calculateDiscount(subtotalAfterItemsDiscount, dto.globalDiscountType, dto.globalDiscountValue, dto.globalDiscountAmount);
      if (globalDiscountAmountRaw > subtotalAfterItemsDiscount) {
        throw { status: 400, message: "El descuento global no puede ser mayor al subtotal de la venta" };
      }
      const globalDiscountAmount = this.round2(Math.min(globalDiscountAmountRaw, subtotalAfterItemsDiscount));
      const calculatedTotal = this.round2(Math.max(0, subtotalAfterItemsDiscount - globalDiscountAmount));

      if (totalPaid > calculatedTotal) {
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
          subtotal: Number(saleSubtotal.toFixed(2)),
          globalDiscountType: dto.globalDiscountType ?? null,
          globalDiscountValue: dto.globalDiscountValue ?? null,
          globalDiscountAmount: Number(globalDiscountAmount.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          balance: Number(balance.toFixed(2)),
          paymentStatus: paymentStatus,
          createdBy: actorUserId,
          cashBoxId: openBox.id,
          branchId: branchId,
          items: { create: itemsToCreate },
          payments: { create: paymentsData },
        } as any,
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
          client: true,
          branch: { select: { name: true } }
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
        await tx.productSerial.updateMany({
          where: {
            productId: item.productId,
            serialNumber: { in: item.serialNumbers },
            status: ProductSerialStatus.AVAILABLE
          },
          data: {
            status: ProductSerialStatus.SOLD,
            saleId: created.id,
            soldAt: created.createdAt
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: 'SALE',
            quantity: -item.quantity, // Negativo porque es una salida
            previousStock: previousStock,
            newStock: newStock,
            saleId: created.id,
            serialNumbers: item.serialNumbers,
            createdBy: actorUserId
          }
        });
      }
      try {
        const commissionAmount = await CommissionCalculationService.calculateCommission(calculatedTotal);

        // Solo crear comisión si es mayor a 0
        if (commissionAmount > 0) {
          await tx.commission.create({
            data: {
              saleId: created.id,
              userId: sellerId,
              amount: commissionAmount,
              month: created.createdAt.getMonth() + 1, // Mes 1-12
              year: created.createdAt.getFullYear()
            }
          });
        }
      } catch (err) {
        // Si falla el registro de la comision, no debe fallar toda la venta
        console.error("Error al calcular:", err);
        //continuar con la venta sin comisión
      }
      return created;
    });
  },
  
  /**
   * Método para completar un pago pendiente
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
    search?: string;
    branchId?: number;
  }) {
    const result = await SaleRepository.findAll(params);
    return { ...result, data: await this.attachCreatedBy(result.data) };
  },

  async getById(id: string) {
    const s = await SaleRepository.findById(id);
    if (!s) throw { status: 404, message: "Venta no encontrada" };
    return this.attachCreatedBy(s);
  },

  async findByBox(cashBoxId: number) {
    const sales = await SaleRepository.findByBox(cashBoxId);
    return this.attachCreatedBy(sales);
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
