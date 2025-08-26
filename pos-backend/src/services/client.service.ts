// src/services/cliente.service.ts
import { ClienteRepository } from "../repositories/client.repository";
import type { CreateClienteDTO } from "../dtos/createClient.dto";
import type { UpdateClienteDTO } from "../dtos/updateClient.dto";

export const ClienteService = {
  async createCliente(dto: CreateClienteDTO) {
    // aquí podrías añadir validaciones de negocio (ej: formato de teléfono)
    return ClienteRepository.create(dto);
  },

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
