// repositories/passwordResetToken.repository.ts
import { prisma } from "../prismaClient";

export const PasswordResetTokenRepository = {
  async create(token: string, userId: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  },

  async findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async markAsUsed(token: string) {
    return prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  },

  async delete(token: string) {
    return prisma.passwordResetToken.delete({
      where: { token },
    });
  },

  async deleteExpiredTokens() {
    return prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },

  async isValidToken(token: string) {
    const resetToken = await this.findByToken(token);
    
    if (!resetToken) return false;
    if (resetToken.used) return false;
    if (resetToken.expiresAt < new Date()) return false;
    
    return true;
  },
};