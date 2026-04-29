"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExchangeRateCron = startExchangeRateCron;
exports.initializeExchangeRates = initializeExchangeRates;
const node_cron_1 = __importDefault(require("node-cron"));
const exchangeRate_service_1 = require("../services/exchangeRate.service");
/**
 * Cron job para actualizar tasas de cambio automáticamente
 * Se ejecuta todos los días a las 8:00 AM hora del servidor
 */
function startExchangeRateCron() {
    // Ejecutar todos los días a las 8:00 AM
    node_cron_1.default.schedule('0 8 * * *', async () => {
        console.log('⏰ [CRON] Iniciando actualización de tasas de cambio...');
        try {
            await exchangeRate_service_1.ExchangeRateService.updateFromAPI();
            console.log('✅ [CRON] Tasas de cambio actualizadas exitosamente');
        }
        catch (error) {
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
async function initializeExchangeRates() {
    console.log('🔄 Inicializando tasas de cambio...');
    try {
        await exchangeRate_service_1.ExchangeRateService.updateFromAPI();
        console.log('✅ Tasas de cambio inicializadas');
    }
    catch (error) {
        console.error('⚠️ Error en inicialización de tasas (continuando...):', error);
    }
}
