"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerRepository = void 0;
const prismaClient_1 = require("../prismaClient"); // ajusta la ruta si es otra
exports.providerRepository = {
    async create(dto) {
        return prismaClient_1.prisma.provider.create({
            data: {
                name: dto.name,
                countryCode: dto.countryCode,
                country: dto.country,
                phone: dto.phone,
            },
        });
    },
    async findAll() {
        return prismaClient_1.prisma.provider.findMany({
            orderBy: { createdAt: "desc" },
        });
    },
    async findById(id) {
        return prismaClient_1.prisma.provider.findUnique({ where: { id_provider: id } });
    },
    async update(id, dto) {
        const existing = await prismaClient_1.prisma.provider.findUnique({ where: { id_provider: id } });
        if (!existing)
            return null;
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.countryCode !== undefined)
            data.countryCode = dto.countryCode;
        if (dto.country !== undefined)
            data.country = dto.country;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        return prismaClient_1.prisma.provider.update({
            where: { id_provider: id },
            data,
        });
    },
    async delete(id) {
        const existing = await prismaClient_1.prisma.provider.findUnique({ where: { id_provider: id } });
        if (!existing)
            return null;
        return prismaClient_1.prisma.provider.delete({ where: { id_provider: id } });
    },
};
