"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
const prismaClient_1 = require("../prismaClient");
const db = prismaClient_1.prisma;
function validateDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
        throw { status: 400, message: "Fechas inválidas" };
    if (start >= end)
        throw { status: 400, message: "startDate debe ser menor que endDate" };
}
exports.PromotionService = {
    list() {
        return db.promotion.findMany({ include: { products: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
    },
    get(id) {
        return db.promotion.findUnique({ where: { id }, include: { products: { select: { id: true, name: true } } } });
    },
    async create(dto) {
        validateDates(dto.startDate, dto.endDate);
        return db.promotion.create({
            data: {
                name: dto.name.trim(),
                discountType: dto.discountType,
                discountValue: Number(dto.discountValue),
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                isActive: dto.isActive ?? true,
                products: { connect: (dto.productIds || []).map((id) => ({ id })) }
            },
            include: { products: { select: { id: true, name: true } } }
        });
    },
    async update(id, dto) {
        validateDates(dto.startDate, dto.endDate);
        return db.promotion.update({
            where: { id },
            data: {
                name: dto.name.trim(),
                discountType: dto.discountType,
                discountValue: Number(dto.discountValue),
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                isActive: dto.isActive ?? true,
                products: { set: (dto.productIds || []).map((pid) => ({ id: pid })) }
            },
            include: { products: { select: { id: true, name: true } } }
        });
    },
    remove(id) {
        return db.promotion.delete({ where: { id } });
    }
};
