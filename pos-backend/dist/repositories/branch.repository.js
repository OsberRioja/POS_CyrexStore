"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class BranchRepository {
    async findAll() {
        return prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }
    async findById(id) {
        return prisma.branch.findUnique({
            where: { id, isActive: true }
        });
    }
    async create(data) {
        return prisma.branch.create({
            data: {
                ...data,
                isActive: true
            }
        });
    }
    async update(id, data) {
        return prisma.branch.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return prisma.branch.update({
            where: { id },
            data: { isActive: false }
        });
    }
}
exports.BranchRepository = BranchRepository;
