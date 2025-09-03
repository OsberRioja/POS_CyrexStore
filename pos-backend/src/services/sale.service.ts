// src/services/sale.service.ts
import { PrismaClient } from "@prisma/client";
import { SaleRepository } from "../repositories/sale.repository";
import type { CreateSaleDTO, SaleItemDTO, SalePaymentDTO } from "../dtos/sale.dto";
import { CashBoxRepository } from "../repositories/cashBox.repository";
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";

const prisma = new PrismaClient();

export const SaleService = {
  /**
   * Crea una venta completa en transacción:
   * - valida productos / stock
   * - calcula unitPrice y subtotal
   * - valida suma de pagos == total
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
      // validamos producto y stock dentro de la transacción abajo
      itemsData.push({ productId: String(it.productId), quantity, unitPrice: Number(it.unitPrice) });
    }

    // Validar payments
    const paymentsDto = dto.payments;
    if (!paymentsDto || paymentsDto.length === 0) throw { status: 400, message: "Debe incluir al menos un payment" };
    for (const p of paymentsDto) {
      if (!p.paymentMethodId || Number.isNaN(Number(p.amount))) throw { status: 400, message: "Cada payment debe incluir paymentMethodId y amount válidos" };
    }

    // calcular total (desde itemsData usando unitPrice * qty)
    const total = itemsData.reduce((s, i) => s + Number(i.unitPrice) * Number(i.quantity), 0);
    const sumPayments = paymentsDto.reduce((s: number, p: any) => s + Number(p.amount), 0);
    if (Math.abs(Number(sumPayments.toFixed(2)) - Number(total.toFixed(2))) > 0.01) {
      throw { status: 400, message: `Suma de payments (${sumPayments}) no coincide con total calculado (${total})` };
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

      // 1) validar productos (existen y stock)
      const itemsToCreate: any[] = [];
      for (const it of itemsData) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw { status: 404, message: `Producto ${it.productId} no encontrado` };
        if (product.stock < it.quantity) throw { status: 400, message: `Stock insuficiente para producto ${product.name}` };

        const unitPrice = Number(product.salePrice);
        const subtotal = unitPrice * Number(it.quantity);
        itemsToCreate.push({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice,
          subtotal,
        });
      }

      // 2) preparar paymentsData (y verificar métodos)
      const paymentsData: any[] = [];
      for (const p of paymentsDto) {
        const pm = await tx.paymentMethod.findUnique({ where: { id: p.paymentMethodId } });
        if (!pm) throw { status: 404, message: `Método de pago ${p.paymentMethodId} no encontrado` };
        const isCash = !!(pm as any).isCash;
        paymentsData.push({
          paymentMethodId: Number(p.paymentMethodId),
          amount: Number(p.amount),
          cashBoxId: isCash ? openBox.id : undefined,
        });
      }

      // 3) crear venta con nested items y payments
      const created = await tx.sale.create({
        data: {
          sellerId: String(sellerId),
          clientId: clientId ?? undefined,
          total,
          createdBy: dto.createdBy ?? actorUserId,
          cashBoxId: openBox.id,
          items: { create: itemsToCreate },
          payments: { create: paymentsData },
        },
        include: {
          items: true,
          payments: { include: { paymentMethod: true } },
        },
      });

      // 4) decrementar stock
      for (const it of itemsToCreate) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: Number(it.quantity) } },
        });
      }

      return created;
    });
  },


  async list(params: {
    page?: number;
    limit?: number;
    sellerId?: string;
    cashBoxId?: number;
    dateFrom?: string;
    dateTo?: string;
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
  } 
};
