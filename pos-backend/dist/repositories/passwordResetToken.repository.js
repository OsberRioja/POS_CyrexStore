"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetTokenRepository = void 0;
// repositories/passwordResetToken.repository.ts
const prismaClient_1 = require("../prismaClient");
exports.PasswordResetTokenRepository = {
    async create(token, userId, expiresAt) {
        return prismaClient_1.prisma.passwordResetToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    },
    async findByToken(token) {
        return prismaClient_1.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
    },
    async markAsUsed(token) {
        return prismaClient_1.prisma.passwordResetToken.update({
            where: { token },
            data: { used: true },
        });
    },
    async delete(token) {
        return prismaClient_1.prisma.passwordResetToken.delete({
            where: { token },
        });
    },
    async deleteExpiredTokens() {
        return prismaClient_1.prisma.passwordResetToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    },
    async isValidToken(token) {
        const resetToken = await this.findByToken(token);
        if (!resetToken)
            return false;
        if (resetToken.used)
            return false;
        if (resetToken.expiresAt < new Date())
            return false;
        return true;
    },
};
