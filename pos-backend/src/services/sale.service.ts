import { SaleRepository } from "../repositories/sale.repository";
import { CashBoxRepository } from "../repositories/cashBox.repository";
import { ClienteRepository } from "../repositories/client.repository";
import { UserRepository } from "../repositories/user.repository";
import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";
import { CreateSaleDTO } from "../dtos/sale.dto";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const SaleService = {
  async createSale(dto: CreateSaleDTO, actorUserId: string) {
    // 1) determine sellerId: if dto.sellerUserCode -> lookup user by code, else use dto.sellerId or actorUserId
    let sellerId = dto.sellerId;
    if (!sellerId && dto.sellerUserCode) {
      const u = await UserRepository.findByUsercode(dto.sellerUserCode);
      if (!u) throw { status: 404, message: "Vendedor no encontrado por userCode" };
      sellerId = u.id;
    }
    if (!sellerId) sellerId = actorUserId;

    // 2) client: if dto.client present -> create client, else set clientId = dto.clientId
    let clientId = dto.clientId;
    if (!clientId && dto.client) {
      const newClient = await ClienteRepository.create(dto.client);
      clientId = newClient.id_cliente;
    }

    // 3) check there is an open cashbox (required to register sale) -> return error if none
    const openBox = await CashBoxRepository.findOpen();
    if (!openBox) throw { status: 400, message: "Debe abrir caja antes de registrar ventas" };

    // 4) validate payments sum equals items total
    // 5) create sale via repository; pass openBox.id to link payments in cash
    const sale = await SaleRepository.createFull(dto, sellerId, clientId, openBox.id);
    return sale;
  }
};
