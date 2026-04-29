"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteRepository = void 0;
const prismaClient_1 = require("../prismaClient"); // ajusta la ruta si tu prismaClient está en otra carpeta
exports.ClienteRepository = {
    /**
   * Busca clientes por query (nombre, telefono, genero, tipo_cliente) y pagina.
   * No busca por id.
   * Retorna { data: Cliente[], total: number }
   */
    async searchAndPaginate(opts) {
        const { q, page = 1, limit = 20 } = opts;
        const where = {};
        if (q && q.trim().length > 0) {
            const text = q.trim();
            // Construir condiciones OR (case-insensitive)
            where.OR = [
                { nombre: { contains: text, mode: "insensitive" } },
                { phone: { contains: text, mode: "insensitive" } },
                { telefono: { contains: text, mode: "insensitive" } },
                { genero: { contains: text, mode: "insensitive" } },
                // Buscar por tipo_cliente SOLO si el texto coincide con algún valor del enum
                ...(text.toUpperCase() === "PERSONA" || text.toUpperCase() === "EMPRESA"
                    ? [{ tipo_cliente: { equals: text.toUpperCase() } }]
                    : []),
            ];
        }
        const skip = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, limit));
        const take = Math.max(1, Math.min(limit, 100)); // cap máximo 100 por página por seguridad
        const [total, data] = await Promise.all([
            prismaClient_1.prisma.cliente.count({ where }),
            prismaClient_1.prisma.cliente.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
        ]);
        return { data, total };
    },
    async create(dto) {
        const data = {
            tipo_cliente: dto.tipoCliente,
            nombre: dto.nombre,
            countryCode: dto.countryCode,
            country: dto.country,
            phone: dto.phone ?? dto.telefono ?? "",
            telefono: dto.phone ?? dto.telefono ?? "",
            genero: dto.genero ?? null,
            fecha_nacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        };
        return prismaClient_1.prisma.cliente.create({ data });
    },
    async findAll() {
        return prismaClient_1.prisma.cliente.findMany({ orderBy: { createdAt: "desc" } });
    },
    async findById(id) {
        return prismaClient_1.prisma.cliente.findUnique({ where: { id_cliente: id } });
    },
    async update(id, dto) {
        const data = {};
        if (dto.tipoCliente !== undefined)
            data.tipo_cliente = dto.tipoCliente;
        if (dto.nombre !== undefined)
            data.nombre = dto.nombre;
        if (dto.countryCode !== undefined)
            data.countryCode = dto.countryCode;
        if (dto.country !== undefined)
            data.country = dto.country;
        if (dto.phone !== undefined || dto.telefono !== undefined) {
            const normalizedPhone = dto.phone ?? dto.telefono ?? "";
            data.phone = normalizedPhone;
            data.telefono = normalizedPhone;
        }
        if (dto.genero !== undefined)
            data.genero = dto.genero;
        if (dto.fechaNacimiento !== undefined)
            data.fecha_nacimiento = dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null;
        return prismaClient_1.prisma.cliente.update({
            where: { id_cliente: id },
            data,
        });
    },
    async delete(id) {
        return prismaClient_1.prisma.cliente.delete({ where: { id_cliente: id } });
    },
    async findSalesByClientId(clientId) {
        return prismaClient_1.prisma.sale.findMany({
            where: { clientId },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true, sku: true }
                        }
                    }
                },
                payments: {
                    include: {
                        paymentMethod: {
                            select: { name: true, isCash: true }
                        }
                    }
                },
                seller: {
                    select: { id: true, name: true, userCode: true }
                },
                branch: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });
    },
};
