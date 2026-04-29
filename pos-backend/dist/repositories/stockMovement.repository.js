"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceHistoryRepository = exports.StockMovementRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.StockMovementRepository = {
    create: async (data) => {
        return prisma.stockMovement.create({
            data,
            include: {
                product: {
                    select: { id: true, name: true, sku: true }
                },
                provider: {
                    select: { id_provider: true, name: true }
                },
                user: {
                    select: { id: true, name: true, userCode: true }
                }
            }
        });
    },
    findAll: async (filters) => {
        const where = {};
        if (filters.productId)
            where.productId = filters.productId;
        if (filters.movementType)
            where.movementType = filters.movementType;
        if (filters.saleId)
            where.saleId = filters.saleId;
        if (filters.branchId !== undefined) {
            where.product = {
                branchId: filters.branchId
            };
        }
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom)
                where.createdAt.gte = filters.dateFrom;
            if (filters.dateTo)
                where.createdAt.lte = filters.dateTo;
        }
        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                skip: filters.skip,
                take: filters.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: {
                        select: { id: true, name: true, sku: true, stock: true, branchId: true, priceCurrency: true }
                    },
                    provider: {
                        select: { id_provider: true, name: true }
                    },
                    sale: {
                        select: { id: true, total: true, createdAt: true }
                    },
                    user: {
                        select: { id: true, name: true, userCode: true }
                    }
                }
            }),
            prisma.stockMovement.count({ where })
        ]);
        return { movements, total };
    },
    getProductHistory: async (productId, branchId, limit = 50) => {
        const where = { productId };
        // Filtrar directamente por branchId a través de la relación con Product
        if (branchId !== undefined) {
            where.product = {
                branchId: branchId
            };
        }
        return prisma.stockMovement.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                        branchId: true, // ← Incluir branchId para verificación en frontend
                        branch: { select: { name: true } } // ← Incluir información de la sucursal
                    }
                },
                provider: {
                    select: { name: true }
                },
                user: {
                    select: { name: true, userCode: true }
                },
                sale: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                        client: {
                            select: { nombre: true }
                        },
                        seller: {
                            select: { name: true, userCode: true }
                        },
                        paymentStatus: true
                    }
                },
                return: {
                    select: {
                        id: true,
                        reason: true
                    }
                }
            }
        });
    },
};
exports.PriceHistoryRepository = {
    create: async (data) => {
        return prisma.priceHistory.create({
            data,
            include: {
                user: {
                    select: { name: true, userCode: true }
                }
            }
        });
    },
    findByProduct: async (productId, limit = 20) => {
        return prisma.priceHistory.findMany({
            where: { productId },
            take: limit,
            orderBy: { changedAt: 'desc' },
            include: {
                user: {
                    select: { name: true, userCode: true }
                }
            }
        });
    },
    findAllByProduct: async (productId) => {
        return prisma.priceHistory.findMany({
            where: { productId },
            orderBy: { changedAt: 'desc' },
            include: {
                user: {
                    select: { name: true, userCode: true }
                }
            }
        });
    }
};
