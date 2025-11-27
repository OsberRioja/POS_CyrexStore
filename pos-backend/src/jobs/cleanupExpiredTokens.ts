import { PasswordResetService } from "../services/passwordReset.service";

export const cleanupExpiredTokens = async () => {
  try {
    const result = await PasswordResetService.cleanupExpiredTokens();
    console.log(`🧹 Tokens expirados eliminados: ${result.count}`);
  } catch (error) {
    console.error("Error limpiando tokens expirados:", error);
  }
};

// Ejecutar cada 24 horas
export const startTokenCleanupCron = () => {
  // Ejecutar inmediatamente al iniciar
  cleanupExpiredTokens();
  
  // Programar ejecución cada 24 horas
  setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
  
  console.log("✅ Limpieza de tokens expirados programada");
};