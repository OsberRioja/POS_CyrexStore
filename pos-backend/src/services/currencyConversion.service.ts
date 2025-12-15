// src/services/currencyConversion.service.ts
import { ExchangeRateService } from "./exchangeRate.service";

export const CurrencyConversionService = {
  /**
   * Convertir múltiples montos de una vez
   */
  async convertBatch(
    items: Array<{
      amount: number;
      fromCurrency: string;
      toCurrency: string;
    }>
  ): Promise<Map<string, number>> {
    // Agrupar por par de monedas
    const conversions = new Map<string, number>();
    const uniquePairs = new Set<string>();
    
    // Crear conjunto único de pares de conversión
    items.forEach(item => {
      const key = `${item.fromCurrency}:${item.toCurrency}`;
      uniquePairs.add(key);
    });
    
    // Obtener tasas para cada par único
    const rates = new Map<string, number>();
    for (const pair of uniquePairs) {
      const [fromCurrency, toCurrency] = pair.split(':');
      try {
        const rate = await ExchangeRateService.getRate(fromCurrency, toCurrency);
        rates.set(pair, rate);
      } catch (error) {
        console.error(`Error obteniendo tasa para ${pair}:`, error);
        rates.set(pair, 1); // Tasa por defecto en caso de error
      }
    }
    
    // Convertir todos los montos usando las tasas obtenidas
    items.forEach(item => {
      const key = `${item.fromCurrency}:${item.toCurrency}`;
      const rate = rates.get(key) || 1;
      const convertedAmount = item.amount * rate;
      // Usar el ID del item como clave, o podrías usar un índice
      conversions.set(`${item.amount}:${key}`, convertedAmount);
    });
    
    return conversions;
  },

  /**
   * Convertir costo de productos a BOB en lote
   */
  async convertProductsCostToBOB(products: Array<{
    id: string;
    costPrice: number;
    priceCurrency: string;
    stock: number;
  }>): Promise<Map<string, number>> {
    const items = products.map(product => ({
      amount: product.costPrice,
      fromCurrency: product.priceCurrency || 'BOB',
      toCurrency: 'BOB'
    }));

    return this.convertBatch(items);
  }
};