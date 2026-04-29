"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.productRepository = {
    async create(dto, createdBy, branchId) {
        return prisma.product.create({
            data: {
                createdBy,
                sku: dto.sku ?? "",
                codigoInterno: dto.codigoInterno,
                name: dto.name,
                description: dto.description,
                costPrice: dto.costPrice,
                salePrice: dto.salePrice,
                stock: dto.stock ?? 0,
                category: dto.category,
                brand: dto.brand,
                imageUrl: dto.imageUrl,
                providerId: dto.providerId ? Number(dto.providerId) : null,
                branchId: branchId,
            },
            include: { user: true, provider: true, branch: { select: { name: true } } },
        });
    },
    findAll(includeInactive = false, branchId, onlyInStock = false) {
        return prisma.product.findMany({
            where: {
                ...(includeInactive ? undefined : { isActive: true }),
                ...(branchId ? { branchId } : {}),
                ...(onlyInStock ? { stock: { gte: 1 } } : {})
            },
            include: {
                user: { select: { name: true, userCode: true } },
                provider: true,
                branch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    findAllActive(branchId, onlyInStock = false) {
        return prisma.product.findMany({
            where: {
                isActive: true,
                ...(branchId ? { branchId } : {}),
                ...(onlyInStock ? { stock: { gte: 1 } } : {})
            },
            include: {
                user: { select: { name: true, userCode: true } },
                provider: true,
                branch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    async findById(id) {
        return await prisma.product.findUnique({
            where: { id },
            include: { user: true, provider: true, branch: { select: { name: true } } },
        });
    },
    async update(id, data) {
        return await prisma.product.update({
            where: { id },
            data: {
                ...data,
                ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl })
            },
            include: { user: true, provider: true, branch: { select: { name: true } } },
        });
    },
    async delete(id) {
        return await prisma.product.delete({ where: { id } });
    },
};
