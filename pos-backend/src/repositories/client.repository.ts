import { prisma } from "../prismaClient"; // ajusta la ruta si tu prismaClient está en otra carpeta
import type { CreateClienteDTO } from "../dtos/createClient.dto";
import type { UpdateClienteDTO } from "../dtos/updateClient.dto";
import type { Cliente } from "@prisma/client";

export const ClienteRepository = {
    /**
   * Busca clientes por query (nombre, telefono, genero, tipo_cliente) y pagina.
   * No busca por id.
   * Retorna { data: Cliente[], total: number }
   */
  async searchAndPaginate(opts: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Cliente[]; total: number }> {
    const { q, page = 1, limit = 20 } = opts;

    const where: any = {};

    if (q && q.trim().length > 0) {
      const text = q.trim();
      // Construir condiciones OR (case-insensitive)
      where.OR = [
        { nombre: { contains: text, mode: "insensitive" } },
        { telefono: { contains: text, mode: "insensitive" } },
        { genero: { contains: text, mode: "insensitive" } },
        // Buscar por tipo_cliente SOLO si el texto coincide con algún valor del enum
        ...(text.toUpperCase() === "PERSONA" || text.toUpperCase() === "EMPRESA"
          ? [{ tipo_cliente: { equals: text.toUpperCase() as any } }]
          : []),
        ];
    }

    const skip = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, limit));
    const take = Math.max(1, Math.min(limit, 100)); // cap máximo 100 por página por seguridad

    const [total, data] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.cliente.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return { data, total };
  },


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
