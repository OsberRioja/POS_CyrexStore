// src/services/cliente.service.ts
import { ClienteRepository } from "../repositories/client.repository";
import type { CreateClienteDTO } from "../dtos/createClient.dto";
import type { UpdateClienteDTO } from "../dtos/updateClient.dto";

export const ClienteService = {
  /**
   * q: texto de búsqueda
   * page: número de página (1-based)
   * limit: items por página
   * NOTA: Clientes son GLOBALES, no se filtra por sucursal
   */
  async searchClients(q?: string, page = 1, limit = 20) {
    // Validaciones y sanitización básica
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    if (pageNum < 1) throw { status: 400, message: "page debe ser >= 1" };
    if (limitNum < 1 || limitNum > 100) throw { status: 400, message: "limit debe estar entre 1 y 100" };

    // Clientes son GLOBALES - no se pasa branchId
    return ClienteRepository.searchAndPaginate({ q: q?.toString(), page: pageNum, limit: limitNum });
  },

  // ← NOTA: No se modifica createCliente - clientes son globales
  async createCliente(dto: CreateClienteDTO) {
    // aquí podrías añadir validaciones de negocio (ej: formato de teléfono)
    return ClienteRepository.create(dto);
  },

  // ← NOTA: No se modifica listClientes - clientes son globales
  async listClientes() {
    return ClienteRepository.findAll();
  },

  async getClienteById(id: number) {
    const c = await ClienteRepository.findById(id);
    if (!c) throw { status: 404, message: "Cliente no encontrado" };
    return c;
  },

  async updateCliente(id: number, dto: UpdateClienteDTO) {
    // opcional: verificar existencia antes de update
    const exists = await ClienteRepository.findById(id);
    if (!exists) throw { status: 404, message: "Cliente no encontrado" };
    return ClienteRepository.update(id, dto);
  },

  async deleteCliente(id: number) {
    const exists = await ClienteRepository.findById(id);
    if (!exists) throw { status: 404, message: "Cliente no encontrado" };
    return ClienteRepository.delete(id);
  },
};