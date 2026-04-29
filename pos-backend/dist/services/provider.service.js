"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderService = void 0;
const provider_repository_1 = require("../repositories/provider.repository");
const phone_1 = require("../utils/phone");
exports.ProviderService = {
    async createProveedor(dto) {
        // validaciones de negocio mínimas
        const phone = (0, phone_1.normalizePhoneNumber)(dto.phone);
        const countryCode = (0, phone_1.normalizeCountryCode)(dto.countryCode);
        const country = (dto.country ?? "").trim();
        if (!dto.name || !phone) {
            throw { status: 400, message: "nombre y phone son obligatorios" };
        }
        (0, phone_1.validatePhoneOrThrow)(phone, countryCode, country);
        return provider_repository_1.providerRepository.create({ ...dto, phone, countryCode, country });
    },
    async listProveedores() {
        return provider_repository_1.providerRepository.findAll();
    },
    async getProveedorById(id) {
        const p = await provider_repository_1.providerRepository.findById(id);
        if (!p)
            throw { status: 404, message: "Proveedor no encontrado" };
        return p;
    },
    async updateProveedor(id, dto) {
        const current = await provider_repository_1.providerRepository.findById(id);
        if (!current)
            throw { status: 404, message: "Proveedor no encontrado" };
        const phone = (0, phone_1.normalizePhoneNumber)(dto.phone ?? current.phone);
        const countryCode = (0, phone_1.normalizeCountryCode)(dto.countryCode ?? current.countryCode);
        const country = (dto.country ?? current.country ?? "").trim();
        (0, phone_1.validatePhoneOrThrow)(phone, countryCode, country);
        const updated = await provider_repository_1.providerRepository.update(id, { ...dto, phone, countryCode, country });
        if (!updated)
            throw { status: 404, message: "Proveedor no encontrado" };
        return updated;
    },
    async deleteProveedor(id) {
        const deleted = await provider_repository_1.providerRepository.delete(id);
        if (!deleted)
            throw { status: 404, message: "Proveedor no encontrado" };
        return deleted;
    },
};
