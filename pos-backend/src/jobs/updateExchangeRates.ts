import cron from 'node-cron';
import { ExchangeRateService } from '../services/exchangeRate.service';

/**
 * Cron job para actualizar tasas de cambio automáticamente
 * Se ejecuta todos los días a las 8:00 AM hora del servidor
 */
export function startExchangeRateCron() {
  // Ejecutar todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [CRON] Iniciando actualización de tasas de cambio...');
    
    try {
      await ExchangeRateService.updateFromAPI();
      console.log('✅ [CRON] Tasas de cambio actualizadas exitosamente');
    } catch (error) {
      console.error('❌ [CRON] Error actualizando tasas de cambio:', error);
    }
  }, {
    timezone: "America/La_Paz" // Zona horaria de Bolivia
  });

  console.log('✅ Cron job de tasas de cambio iniciado (8:00 AM diario)');
}

/**
 * Ejecutar actualización inicial al iniciar el servidor
 */
export async function initializeExchangeRates() {
  console.log('🔄 Inicializando tasas de cambio...');
  
  try {
    await ExchangeRateService.updateFromAPI();
    console.log('✅ Tasas de cambio inicializadas');
  } catch (error) {
    console.error('⚠️ Error en inicialización de tasas (continuando...):', error);
  }
}