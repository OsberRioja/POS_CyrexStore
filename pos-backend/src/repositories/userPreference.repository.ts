import { prisma } from '../prismaClient';

export const UserPreferenceRepository = {
  findByUserId: async (userId: string) => {
    return prisma.userPreference.findUnique({
      where: { userId }
    });
  },

  upsert: async (userId: string, currency: string) => {
    return prisma.userPreference.upsert({
      where: { userId },
      update: { 
        preferredCurrency: currency,
        updatedAt: new Date()
      },
      create: {
        userId,
        preferredCurrency: currency
      }
    });
  }
};