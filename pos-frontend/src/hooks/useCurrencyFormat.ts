import { useState, useEffect } from 'react';
import { useCurrency } from '../context/currencyContext';

export function useCurrencyFormat(amount: number, fromCurrency: string = 'BOB') {
  const { currency, convertAmount } = useCurrency();
  const [converted, setConverted] = useState<number>(amount);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const convert = async () => {
      if (fromCurrency === currency) {
        setConverted(amount);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await convertAmount(amount, fromCurrency);
        setConverted(result);
      } catch (error) {
        console.error('Error converting:', error);
        setConverted(amount);
      } finally {
        setLoading(false);
      }
    };

    convert();
  }, [amount, fromCurrency, currency]);

  return { converted, loading };
}