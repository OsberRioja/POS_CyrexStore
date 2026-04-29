"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreferenceRepository = void 0;
const prismaClient_1 = require("../prismaClient");
exports.UserPreferenceRepository = {
    findByUserId: async (userId) => {
        return prismaClient_1.prisma.userPreference.findUnique({
            where: { userId }
        });
    },
    upsert: async (userId, currency) => {
        return prismaClient_1.prisma.userPreference.upsert({
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
