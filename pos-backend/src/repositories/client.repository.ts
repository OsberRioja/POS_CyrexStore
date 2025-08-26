// src/repositories/cliente.repository.ts
import { prisma } from "../prismaClient"; // ajusta la ruta si tu prismaClient está en otra carpeta
import type { CreateClienteDTO } from "../dtos/createClient.dto";
import type { UpdateClienteDTO } from "../dtos/updateClient.dto";
import type { Cliente } from "@prisma/client";

export const ClienteRepository = {
  async create(dto: CreateClienteDTO): Promise<Cliente> {
    const data: any = {
      tipo_cliente: dto.tipoCliente,
      nombre: dto.nombre,
      telefono: dto.telefono,
      genero: dto.genero ?? null,
      fecha_nacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
    };

    return prisma.cliente.create({ data });
  },

  async findAll(): Promise<Cliente[]> {
    return prisma.cliente.findMany({ orderBy: { createdAt: "desc" } });
  },

  async findById(id: number): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { id_cliente: id } });
  },

  async update(id: number, dto: UpdateClienteDTO): Promise<Cliente> {
    const data: any = {};
    if (dto.tipoCliente !== undefined) data.tipo_cliente = dto.tipoCliente;
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.genero !== undefined) data.genero = dto.genero;
    if (dto.fechaNacimiento !== undefined) data.fecha_nacimiento = dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null;

    return prisma.cliente.update({
      where: { id_cliente: id },
      data,
    });
  },

  async delete(id: number): Promise<Cliente> {
    return prisma.cliente.delete({ where: { id_cliente: id } });
  },
};
