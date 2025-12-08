import { useState, useEffect } from 'react';
import { exchangeRateService } from '../services/exchangeRateService';

interface BulkConversionItem {
  id: string;
  costPrice: number;
  priceCurrency: string;
  unitPrice: number;
  itemData?: {
    originalPrice?: number;
    originalCurrency?: string;
    conversionRate?: number;
  };
}

export const useBulkCostConverter = (items: BulkConversionItem[]) => {
  const [convertedItems, setConvertedItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const getDefaultRate = (currency: string): number => {
    const defaults: Record<string, number> = {
      USD: 6.91,
      CNY: 0.95,
      EUR: 7.40
    };
    return defaults[currency] || 1;
  };

  const isReasonableRate = (rate: number, currency: string): boolean => {
    const ranges: Record<string, { min: number; max: number }> = {
      USD: { min: 6.0, max: 8.0 },
      CNY: { min: 0.8, max: 1.2 },
      EUR: { min: 7.0, max: 8.0 }
    };

    const range = ranges[currency];
    if (!range) return rate > 0 && rate < 100;

    return rate >= range.min && rate <= range.max;
  };

  useEffect(() => {
    const convertAllCosts = async () => {
      if (items.length === 0) return;
      
      setLoading(true);
      const result: Record<string, number> = {};

      try {
        // 1. Obtener tasas actuales para todas las monedas necesarias
        const currenciesNeeded = Array.from(
          new Set(items.map(item => item.priceCurrency).filter(c => c !== 'BOB'))
        );

        const currentRates: Record<string, number> = {};
        for (const currency of currenciesNeeded) {
          try {
            const response = await exchangeRateService.getRate(currency, 'BOB');
            currentRates[currency] = response.data?.rate || getDefaultRate(currency);
          } catch (error) {
            console.error(`Error obteniendo tasa para ${currency}:`, error);
            currentRates[currency] = getDefaultRate(currency);
          }
        }

        // 2. Procesar cada item
        for (const item of items) {
          if (item.priceCurrency === 'BOB') {
            result[item.id] = item.costPrice;
            continue;
          }

          let costoEnBOB = item.costPrice;
          let tasaUsada = currentRates[item.priceCurrency]; // Tasa actual por defecto
          let metodoConversion = 'actual';

          // 🔥 CRÍTICO: Calcular tasa real basada en los datos de la venta
          if (item.itemData?.originalPrice && item.itemData.originalPrice > 0 && item.unitPrice > 0) {
            // Calcular tasa implícita: precioVentaBOB / precioOriginalMoneda
            const tasaImplicita = item.unitPrice / item.itemData.originalPrice;
            
            // Validar que la tasa sea razonable (ej: USD entre 6-8, CNY entre 0.8-1.2)
            if (isReasonableRate(tasaImplicita, item.priceCurrency)) {
              tasaUsada = tasaImplicita;
              metodoConversion = 'implícita';
            } else if (item.itemData?.conversionRate && item.itemData.conversionRate > 1) {
              tasaUsada = item.itemData.conversionRate;
              metodoConversion = 'guardada';
            }
          } else if (item.itemData?.conversionRate && item.itemData.conversionRate > 1) {
            tasaUsada = item.itemData.conversionRate;
            metodoConversion = 'guardada';
          }

          costoEnBOB = item.costPrice * tasaUsada;
          result[item.id] = costoEnBOB;
          
          // Opcional: guardar info de depuración
          console.log(`Item ${item.id}: ${item.costPrice} ${item.priceCurrency} → ${costoEnBOB} BOB (tasa: ${tasaUsada}, método: ${metodoConversion})`);
        }

        setConvertedItems(result);
      } catch (error) {
        console.error('Error en conversión masiva:', error);
      } finally {
        setLoading(false);
      }
    };

    convertAllCosts();
  }, [items]);

  return { convertedItems, loading };
};