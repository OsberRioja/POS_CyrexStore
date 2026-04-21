import { providerRepository } from "../repositories/provider.repository";
import type { CreateProviderDTO } from "../dtos/createProvider.dto";
import type { UpdateProviderDTO } from "../dtos/updateProvider.dto";
import { normalizeCountryCode, normalizePhoneNumber, validatePhoneOrThrow } from "../utils/phone";

export const ProviderService = {
  async createProveedor(dto: CreateProviderDTO) {
    // validaciones de negocio mínimas
    const phone = normalizePhoneNumber(dto.phone);
    const countryCode = normalizeCountryCode(dto.countryCode);
    const country = (dto.country ?? "").trim();

    if (!dto.name || !phone) {
      throw { status: 400, message: "nombre y phone son obligatorios" };
    }

    validatePhoneOrThrow(phone, countryCode, country);
    return providerRepository.create({ ...dto, phone, countryCode, country });
  },

  async listProveedores() {
    return providerRepository.findAll();
  },

  async getProveedorById(id: number) {
    const p = await providerRepository.findById(id);
    if (!p) throw { status: 404, message: "Proveedor no encontrado" };
    return p;
  },

  async updateProveedor(id: number, dto: UpdateProviderDTO) {
    const current = await providerRepository.findById(id);
    if (!current) throw { status: 404, message: "Proveedor no encontrado" };

    const phone = normalizePhoneNumber(dto.phone ?? current.phone);
    const countryCode = normalizeCountryCode(dto.countryCode ?? current.countryCode);
    const country = (dto.country ?? current.country ?? "").trim();
    validatePhoneOrThrow(phone, countryCode, country);

    const updated = await providerRepository.update(id, { ...dto, phone, countryCode, country });
    if (!updated) throw { status: 404, message: "Proveedor no encontrado" };
    return updated;
  },

  async deleteProveedor(id: number) {
    const deleted = await providerRepository.delete(id);
    if (!deleted) throw { status: 404, message: "Proveedor no encontrado" };
    return deleted;
  },
};
