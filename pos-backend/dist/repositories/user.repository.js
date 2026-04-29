"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const prismaClient_1 = require("../prismaClient");
exports.UserRepository = {
    async create(dto) {
        return prismaClient_1.prisma.user.create({
            data: {
                userCode: dto.userCode,
                name: dto.name ?? `${dto.firstName} ${dto.lastNamePaterno} ${dto.lastNameMaterno}`.trim(),
                firstName: dto.firstName,
                lastNamePaterno: dto.lastNamePaterno,
                lastNameMaterno: dto.lastNameMaterno,
                email: dto.email,
                password: dto.password ?? "",
                countryCode: dto.countryCode,
                country: dto.country,
                phone: dto.phone ?? null,
                role: dto.role,
                passwordChangeRequired: dto.passwordChangeRequired ?? false,
                branchId: dto.branchId, // ← NUEVO: incluir branchId
            },
        });
    },
    async findAll(branchId) {
        // Filtrar por sucursal si se proporciona
        const where = { deleted: false };
        if (branchId !== undefined && branchId !== null) {
            where.branchId = branchId;
        }
        return prismaClient_1.prisma.user.findMany({
            where,
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    },
    async findByEmail(email) {
        return prismaClient_1.prisma.user.findUnique({
            where: {
                email,
                deleted: false
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });
    },
    async findByUsercode(userCode) {
        return prismaClient_1.prisma.user.findUnique({
            where: { userCode, deleted: false },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });
    },
    async findById(id) {
        return prismaClient_1.prisma.user.findUnique({
            where: { id, deleted: false },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });
    },
    async findByName(name) {
        return prismaClient_1.prisma.user.findMany({
            where: { name, deleted: false },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });
    },
    async updateUser(id, data) {
        // Solo actualizar si el usuario existe
        const existingUser = await prismaClient_1.prisma.user.findUnique({ where: { id } });
        if (!existingUser)
            return null;
        const updatedUser = await prismaClient_1.prisma.user.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.firstName !== undefined && { firstName: data.firstName }),
                ...(data.lastNamePaterno !== undefined && { lastNamePaterno: data.lastNamePaterno }),
                ...(data.lastNameMaterno !== undefined && { lastNameMaterno: data.lastNameMaterno }),
                ...(data.password && { password: data.password }),
                ...(data.email && { email: data.email }),
                ...(data.countryCode && { countryCode: data.countryCode }),
                ...(data.country && { country: data.country }),
                ...(data.phone && { phone: data.phone }),
                ...(data.role && { role: data.role }),
                ...(data.passwordChangeRequired !== undefined && {
                    passwordChangeRequired: data.passwordChangeRequired
                }),
                ...(data.branchId !== undefined && { branchId: data.branchId }), // ← NUEVO: actualizar branchId
            },
        });
        return updatedUser;
    },
    async deleteUser(id) {
        // Verificar si existe
        const existingUser = await prismaClient_1.prisma.user.findUnique({ where: { id } });
        if (!existingUser)
            return null;
        // Soft delete: marcar como eliminado en lugar de borrar
        const updatedUser = await prismaClient_1.prisma.user.update({
            where: { id },
            data: {
                deleted: true,
                email: `deleted_${Date.now()}_${existingUser.email}`, // Evitar conflictos de email único
                userCode: -Math.abs(existingUser.userCode ?? 0) // Evitar conflictos de userCode único
            },
        });
        return updatedUser;
    },
    async getByRole(role) {
        return prismaClient_1.prisma.user.findMany({
            where: { role },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });
    }
};
