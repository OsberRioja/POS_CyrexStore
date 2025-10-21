import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { useCurrency } from '../context/currencyContext';

interface FormattedPriceProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showOriginal?: boolean;
}

export default function FormattedPrice({ 
  amount, 
  fromCurrency = 'BOB', 
  className = '',
  showOriginal = false
}: FormattedPriceProps) {
  const { currency, formatCurrency } = useCurrency();
  const { converted, loading } = useCurrencyFormat(amount, fromCurrency);

  if (loading) {
    return (
      <span className={`animate-pulse text-gray-400 ${className}`}>
        Calculando...
      </span>
    );
  }

  const needsConversion = fromCurrency !== currency;

  return (
    <span className={className}>
      {formatCurrency(converted, currency)}
      {needsConversion && showOriginal && (
        <span className="text-xs text-gray-500 ml-1">
          ({formatCurrency(amount, fromCurrency)})
        </span>
      )}
    </span>
  );
}