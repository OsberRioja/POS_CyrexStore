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
  async createSale(dto: CreateSaleDTO, actorUserId: string) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw { status: 400, message: "items es requerido" };
    }
    if (!dto.payments || !Array.isArray(dto.payments) || dto.payments.length === 0) {
      throw { status: 400, message: "payments es requerido" };
    }

    // resolver sellerId (por userCode o id, fallback actor)
    let sellerId = dto.sellerId ?? null;
    if (!sellerId && dto.sellerUserCode) {
      const user = await prisma.user.findUnique({ where: { userCode: dto.sellerUserCode } as any });
      if (!user) throw { status: 404, message: "Vendedor no encontrado por userCode" };
      sellerId = user.id;
    }
    if (!sellerId) sellerId = actorUserId;

    // comprobar que haya caja abierta (regla)
    const openBox = await CashBoxRepository.findOpen();
    if (!openBox) {
      throw { status: 400, message: "Debe abrir caja antes de registrar ventas" };
    }

    // Transacción: crear/obtener cliente (si aplica), validar productos, crear venta y decrementar stock
    return await prisma.$transaction(async (tx) => {
      // 0) Si dto.clientId está presente, la usamos; si no y dto.client existe, intentar buscar por teléfono y si no crear.
      let clientId: number | undefined = dto.clientId;

      if (!clientId && dto.client) {
        // intentar encontrar por teléfono (si hay teléfono)
        let existingClient = null;
        if (dto.client.telefono) {
          existingClient = await tx.cliente.findFirst({ where: { telefono: dto.client.telefono } });
        }
        if (existingClient) {
          clientId = existingClient.id_cliente;
        } else {
          const createdClient = await tx.cliente.create({
            data: {
              tipo_cliente: dto.client.tipoCliente,
              nombre: dto.client.nombre,
              telefono: dto.client.telefono,
              genero: dto.client.genero ?? null,
              fecha_nacimiento: dto.client.fecha_nacimiento ? new Date(dto.client.fecha_nacimiento) : null,
            },
          });
          clientId = createdClient.id_cliente;
        }
      }

      // 1) construir itemsData y validar stock
      const itemsData: Array<any> = [];
      for (const it of dto.items as SaleItemDTO[]) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw { status: 404, message: `Producto ${it.productId} no encontrado` };
        if (product.stock < it.quantity) {
          throw { status: 400, message: `Stock insuficiente para producto ${product.name}` };
        }
        const unitPrice = product.salePrice;
        const subtotal = Number(unitPrice) * Number(it.quantity);
        itemsData.push({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice,
          subtotal,
        });
      }

      // 2) calcular total
      const total = itemsData.reduce((s, i) => s + i.subtotal, 0);

      // 3) validar payments sum
      const paymentsDto = dto.payments as SalePaymentDTO[];
      const sumPayments = paymentsDto.reduce((s, p) => s + Number(p.amount), 0);
      if (Number(sumPayments.toFixed(2)) !== Number(total.toFixed(2))) {
        throw { status: 400, message: `Suma de payments (${sumPayments}) no coincide con total calculado (${total})` };
      }

      // 4) preparar paymentsData y asignar cashBoxId si paymentMethod.isCash
      const paymentsData: Array<any> = [];
      for (const p of paymentsDto) {
        const pm = await tx.paymentMethod.findUnique({ where: { id: p.paymentMethodId } });
        if (!pm) throw { status: 404, message: `Método de pago ${p.paymentMethodId} no encontrado` };
        const isCash = !!pm.isCash;
        paymentsData.push({
          paymentMethodId: p.paymentMethodId,
          amount: Number(p.amount),
          cashBoxId: isCash ? openBox.id : undefined,
        });
      }

      // 5) crear la venta (nested create items & payments), incluyendo clientId si existe
      const created = await tx.sale.create({
        data: {
          sellerId,
          clientId: clientId ?? undefined,
          total,
          createdBy: dto.createdBy ?? actorUserId,
          cashBoxId: openBox.id,
          items: { create: itemsData },
          payments: { create: paymentsData },
        },
        include: {
          items: true,
          payments: { include: { paymentMethod: true } },
        },
      });

      // 6) decrementar stock para cada producto
      for (const it of itemsData) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      return created;
    }); // end transaction
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
};
