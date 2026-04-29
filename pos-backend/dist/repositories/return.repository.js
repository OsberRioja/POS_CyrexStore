"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.ReturnRepository = {
    async create(data) {
        return prisma.return.create({
            data: {
                saleId: data.saleId,
                reason: data.reason,
                approvedBy: data.approvedBy,
                totalRefunded: data.totalRefunded,
                refundMethod: data.refundMethod,
                notes: data.notes,
                status: data.status || client_1.ReturnStatus.PENDING,
                items: {
                    create: data.items,
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
                sale: {
                    include: {
                        client: true,
                        seller: {
                            select: {
                                name: true,
                                userCode: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        name: true,
                        userCode: true,
                    },
                },
            },
        });
    },
    async findById(id) {
        return prisma.return.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
                sale: {
                    include: {
                        client: true,
                        seller: {
                            select: {
                                name: true,
                                userCode: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        name: true,
                        userCode: true,
                    },
                },
            },
        });
    },
    async list(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const where = params.saleId ? { saleId: params.saleId } : {};
        const [total, data] = await Promise.all([
            prisma.return.count({ where }),
            prisma.return.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    sku: true,
                                },
                            },
                        },
                    },
                    sale: {
                        include: {
                            client: true,
                            seller: {
                                select: {
                                    name: true,
                                    userCode: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            name: true,
                            userCode: true,
                        },
                    },
                },
                orderBy: { returnDate: 'desc' },
                skip,
                take: limit,
            }),
        ]);
        return { total, data };
    },
};
