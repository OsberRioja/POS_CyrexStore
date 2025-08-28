import { providerRepository } from "../repositories/provider.repository";
import type { CreateProviderDTO } from "../dtos/createProvider.dto";
import type { UpdateProviderDTO } from "../dtos/updateProvider.dto";

export const ProviderService = {
  async createProveedor(dto: CreateProviderDTO) {
    // validaciones de negocio mínimas
    if (!dto.name || !dto.phone) {
      throw { status: 400, message: "nombre y telefono son obligatorios" };
    }
    return providerRepository.create(dto);
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
    const updated = await providerRepository.update(id, dto);
    if (!updated) throw { status: 404, message: "Proveedor no encontrado" };
    return updated;
  },

  async deleteProveedor(id: number) {
    const deleted = await providerRepository.delete(id);
    if (!deleted) throw { status: 404, message: "Proveedor no encontrado" };
    return deleted;
  },
};
