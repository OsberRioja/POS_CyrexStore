"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTokenCleanupCron = exports.cleanupExpiredTokens = void 0;
const passwordReset_service_1 = require("../services/passwordReset.service");
const cleanupExpiredTokens = async () => {
    try {
        const result = await passwordReset_service_1.PasswordResetService.cleanupExpiredTokens();
        console.log(`🧹 Tokens expirados eliminados: ${result.count}`);
    }
    catch (error) {
        console.error("Error limpiando tokens expirados:", error);
    }
};
exports.cleanupExpiredTokens = cleanupExpiredTokens;
// Ejecutar cada 24 horas
const startTokenCleanupCron = () => {
    // Ejecutar inmediatamente al iniciar
    (0, exports.cleanupExpiredTokens)();
    // Programar ejecución cada 24 horas
    setInterval(exports.cleanupExpiredTokens, 24 * 60 * 60 * 1000);
    console.log("✅ Limpieza de tokens expirados programada");
};
exports.startTokenCleanupCron = startTokenCleanupCron;
