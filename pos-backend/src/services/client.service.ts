// src/services/cliente.service.ts
import { ClienteRepository } from "../repositories/client.repository";
import type { CreateClienteDTO } from "../dtos/createClient.dto";
import type { UpdateClienteDTO } from "../dtos/updateClient.dto";
import { normalizeCountryCode, normalizePhoneNumber, validatePhoneOrThrow } from "../utils/phone";

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
    const phone = normalizePhoneNumber(dto.phone ?? dto.telefono);
    const countryCode = normalizeCountryCode(dto.countryCode);
    const country = (dto.country ?? "").trim();
    validatePhoneOrThrow(phone, countryCode, country);

    return ClienteRepository.create({ ...dto, phone, telefono: phone, countryCode, country });
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
    const exists = await ClienteRepository.findById(id);
    if (!exists) throw { status: 404, message: "Cliente no encontrado" };

    const mergedPhone = normalizePhoneNumber(dto.phone ?? dto.telefono ?? exists.phone ?? exists.telefono);
    const mergedCountryCode = normalizeCountryCode(dto.countryCode ?? exists.countryCode);
    const mergedCountry = (dto.country ?? exists.country ?? "").trim();
    validatePhoneOrThrow(mergedPhone, mergedCountryCode, mergedCountry);

    return ClienteRepository.update(id, { ...dto, phone: mergedPhone, telefono: mergedPhone, countryCode: mergedCountryCode, country: mergedCountry });
  },

  async deleteCliente(id: number) {
    const exists = await ClienteRepository.findById(id);
    if (!exists) throw { status: 404, message: "Cliente no encontrado" };
    return ClienteRepository.delete(id);
  },
};