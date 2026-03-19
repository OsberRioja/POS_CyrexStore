import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useCurrency } from '../../context/currencyContext';

interface DashboardMoneyProps {
  amount: number;
  className?: string;
  fallback?: string;
}

const SYMBOLS: Record<string, string> = {
  BOB: 'Bs.',
  USD: '$',
  CNY: '¥'
};

const formatAmount = (amount: number, currencyCode: string) => {
  const symbol = SYMBOLS[currencyCode] || '';
  return `${symbol} ${new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)}`;
};

export default function DashboardMoney({ amount, className, fallback = '0.00' }: DashboardMoneyProps) {
  const { user, isInBranchMode } = useAuth();
  const { currency, convertAmount } = useCurrency();
  const [displayAmount, setDisplayAmount] = useState<number>(amount || 0);

  const displayCurrency = useMemo(() => {
    const canUseSelectedCurrency = isInBranchMode && user?.role === 'ADMIN';
    return canUseSelectedCurrency ? currency : 'BOB';
  }, [currency, isInBranchMode, user?.role]);

  useEffect(() => {
    let isMounted = true;

    const resolveAmount = async () => {
      const normalizedAmount = Number(amount) || 0;

      if (displayCurrency === 'BOB') {
        if (isMounted) {
          setDisplayAmount(normalizedAmount);
        }
        return;
      }

      try {
        const convertedAmount = await convertAmount(normalizedAmount, 'BOB');
        if (isMounted) {
          setDisplayAmount(convertedAmount);
        }
      } catch (error) {
        console.error('Error converting dashboard amount:', error);
        if (isMounted) {
          setDisplayAmount(normalizedAmount);
        }
      }
    };

    resolveAmount();

    return () => {
      isMounted = false;
    };
  }, [amount, convertAmount, displayCurrency]);

  if (!Number.isFinite(displayAmount)) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{formatAmount(displayAmount, displayCurrency)}</span>;
}
