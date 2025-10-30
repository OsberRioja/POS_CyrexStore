import { useState, useEffect } from 'react';
import { TrendingUp} from 'lucide-react';
import { useCurrency } from '../context/currencyContext';
import { exchangeRateService } from '../services/exchangeRateService';

interface ProductPriceProps {
  product: {
    salePrice: number;
    costPrice?: number;
    priceCurrency: string;
  };
  showCost?: boolean;
  showOriginal?: boolean;
  className?: string;
}

export default function ProductPrice({ 
  product, 
  showCost = false,
  showOriginal = true,
  className = '' 
}: ProductPriceProps) {
  const { currency: userCurrency } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<number>(product.salePrice);
  const [convertedCost, setConvertedCost] = useState<number | undefined>(product.costPrice);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    convertPrices();
  }, [product.salePrice, product.costPrice, product.priceCurrency, userCurrency]);

  const convertPrices = async () => {
    if (product.priceCurrency === userCurrency) {
      setConvertedPrice(product.salePrice);
      setConvertedCost(product.costPrice);
      setExchangeRate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Obtener tasa de cambio
      const rateResponse = await exchangeRateService.getRate(
        product.priceCurrency,
        userCurrency
      );
      const rate = rateResponse.data.rate;
      setExchangeRate(rate);

      // Convertir precios
      setConvertedPrice(product.salePrice * rate);
      if (product.costPrice) {
        setConvertedCost(product.costPrice * rate);
      }
    } catch (error) {
      console.error('Error converting price:', error);
      setConvertedPrice(product.salePrice);
      setConvertedCost(product.costPrice);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      BOB: 'Bs.',
      USD: '$',
      CNY: '¥'
    };

    return `${symbols[currency] || ''} ${amount.toFixed(2)}`;
  };

  const needsConversion = product.priceCurrency !== userCurrency;
  const isAnchored = product.priceCurrency === 'USD' || product.priceCurrency === 'CNY';

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Precio convertido (principal) */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-900">
          {formatPrice(convertedPrice, userCurrency)}
        </span>
        
        {/* Indicador de precio anclado */}
        {isAnchored && needsConversion && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp size={12} />
            Anclado
          </span>
        )}
      </div>

      {/* Precio original (si es diferente) */}
      {needsConversion && showOriginal && (
        <div className="text-xs text-gray-500 mt-0.5">
          Original: {formatPrice(product.salePrice, product.priceCurrency)}
          {exchangeRate && (
            <span className="ml-1">
              (1 {product.priceCurrency} = {exchangeRate.toFixed(4)} {userCurrency})
            </span>
          )}
        </div>
      )}

      {/* Precio de costo (si se solicita) */}
      {showCost && convertedCost !== undefined && (
        <div className="text-xs text-gray-600 mt-1">
          Costo: {formatPrice(convertedCost, userCurrency)}
          {needsConversion && showOriginal && (
            <span className="text-gray-400 ml-1">
              ({formatPrice(product.costPrice!, product.priceCurrency)})
            </span>
          )}
        </div>
      )}

      {/* Margen de ganancia */}
      {showCost && convertedCost !== undefined && (
        <div className="text-xs text-green-600 mt-1">
          Margen: {formatPrice(convertedPrice - convertedCost, userCurrency)} 
          ({(((convertedPrice - convertedCost) / convertedCost) * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
}