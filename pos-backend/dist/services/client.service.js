"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteService = void 0;
// src/services/cliente.service.ts
const client_repository_1 = require("../repositories/client.repository");
const phone_1 = require("../utils/phone");
exports.ClienteService = {
    /**
     * q: texto de búsqueda
     * page: número de página (1-based)
     * limit: items por página
     * NOTA: Clientes son GLOBALES, no se filtra por sucursal
     */
    async searchClients(q, page = 1, limit = 20) {
        // Validaciones y sanitización básica
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 20;
        if (pageNum < 1)
            throw { status: 400, message: "page debe ser >= 1" };
        if (limitNum < 1 || limitNum > 100)
            throw { status: 400, message: "limit debe estar entre 1 y 100" };
        // Clientes son GLOBALES - no se pasa branchId
        return client_repository_1.ClienteRepository.searchAndPaginate({ q: q?.toString(), page: pageNum, limit: limitNum });
    },
    // ← NOTA: No se modifica createCliente - clientes son globales
    async createCliente(dto) {
        const phone = (0, phone_1.normalizePhoneNumber)(dto.phone ?? dto.telefono);
        const countryCode = (0, phone_1.normalizeCountryCode)(dto.countryCode);
        const country = (dto.country ?? "").trim();
        (0, phone_1.validatePhoneOrThrow)(phone, countryCode, country);
        return client_repository_1.ClienteRepository.create({ ...dto, phone, telefono: phone, countryCode, country });
    },
    // ← NOTA: No se modifica listClientes - clientes son globales
    async listClientes() {
        return client_repository_1.ClienteRepository.findAll();
    },
    async getClienteById(id) {
        const c = await client_repository_1.ClienteRepository.findById(id);
        if (!c)
            throw { status: 404, message: "Cliente no encontrado" };
        return c;
    },
    async updateCliente(id, dto) {
        const exists = await client_repository_1.ClienteRepository.findById(id);
        if (!exists)
            throw { status: 404, message: "Cliente no encontrado" };
        const mergedPhone = (0, phone_1.normalizePhoneNumber)(dto.phone ?? dto.telefono ?? exists.phone ?? exists.telefono);
        const mergedCountryCode = (0, phone_1.normalizeCountryCode)(dto.countryCode ?? exists.countryCode);
        const mergedCountry = (dto.country ?? exists.country ?? "").trim();
        (0, phone_1.validatePhoneOrThrow)(mergedPhone, mergedCountryCode, mergedCountry);
        return client_repository_1.ClienteRepository.update(id, { ...dto, phone: mergedPhone, telefono: mergedPhone, countryCode: mergedCountryCode, country: mergedCountry });
    },
    async deleteCliente(id) {
        const exists = await client_repository_1.ClienteRepository.findById(id);
        if (!exists)
            throw { status: 404, message: "Cliente no encontrado" };
        return client_repository_1.ClienteRepository.delete(id);
    },
    async getClientSales(id) {
        const exists = await client_repository_1.ClienteRepository.findById(id);
        if (!exists)
            throw { status: 404, message: "Cliente no encontrado" };
        return client_repository_1.ClienteRepository.findSalesByClientId(id);
    },
};
