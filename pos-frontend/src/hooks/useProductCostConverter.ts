import { useState, useEffect } from 'react';
import { exchangeRateService } from '../services/exchangeRateService';

interface UseProductCostConverterProps {
  costPrice: number;
  priceCurrency: string;
  itemData?: {
    originalPrice?: number;
    originalCurrency?: string;
    conversionRate?: number;
  };
}

export const useProductCostConverter = ({
  costPrice,
  priceCurrency,
  itemData
}: UseProductCostConverterProps) => {
  const [convertedCost, setConvertedCost] = useState<number>(costPrice);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const convertCost = async () => {
      // Si ya está en BOB, no necesita conversión
      if (priceCurrency === 'BOB') {
        setConvertedCost(costPrice);
        setConversionRate(null);
        return;
      }

      setLoading(true);
      try {
        // PRIORIDAD 1: Usar conversionRate guardado en el item
        if (itemData?.conversionRate && itemData.conversionRate > 0) {
          setConvertedCost(costPrice * itemData.conversionRate);
          setConversionRate(itemData.conversionRate);
        }
        // PRIORIDAD 2: Calcular tasa basada en originalPrice/unitPrice
        else if (itemData?.originalPrice && itemData.originalPrice > 0) {
          // Aquí necesitaríamos el unitPrice para calcular
          // Por ahora, obtendremos tasa actual
          const response = await exchangeRateService.getRate(priceCurrency, 'BOB');
          const rate = response.data?.rate;
          if (rate) {
            setConvertedCost(costPrice * rate);
            setConversionRate(rate);
          } else {
            setConvertedCost(costPrice);
          }
        }
        // PRIORIDAD 3: Obtener tasa actual del servicio
        else {
          const response = await exchangeRateService.getRate(priceCurrency, 'BOB');
          const rate = response.data?.rate;
          if (rate) {
            setConvertedCost(costPrice * rate);
            setConversionRate(rate);
          } else {
            setConvertedCost(costPrice);
          }
        }
      } catch (error) {
        console.error(`Error converting ${priceCurrency} to BOB:`, error);
        // Fallback: usar costo sin convertir (aunque sea incorrecto)
        setConvertedCost(costPrice);
      } finally {
        setLoading(false);
      }
    };

    convertCost();
  }, [costPrice, priceCurrency, itemData]);

  return { convertedCost, conversionRate, loading };
};