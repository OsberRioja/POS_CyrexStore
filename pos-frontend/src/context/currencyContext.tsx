import React, { createContext, useContext, useState, useEffect } from 'react';
import { userPreferenceService } from '../services/userPreferenceService';
import { exchangeRateService } from '../services/exchangeRateService';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  convertAmount: (amount: number, fromCurrency?: string) => Promise<number>;
  formatCurrency: (amount: number, fromCurrency?: string) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCIES = {
  BOB: { symbol: 'Bs.', name: 'Bolivianos' },
  USD: { symbol: '$', name: 'Dólares' },
  CNY: { symbol: '¥', name: 'Yuanes' }
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('BOB');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPreference();
  }, []);

  const loadUserPreference = async () => {
    try {
      const response = await userPreferenceService.getMyPreferences();
      setCurrencyState(response.data.preferredCurrency || 'BOB');
    } catch (error) {
      console.error('Error loading currency preference:', error);
      setCurrencyState('BOB');
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = async (newCurrency: string) => {
    try {
      await userPreferenceService.updateCurrency(newCurrency);
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  };

  const convertAmount = async (amount: number, fromCurrency: string = 'BOB'): Promise<number> => {
    if (fromCurrency === currency) return amount;

    try {
      const response = await exchangeRateService.convert(amount, fromCurrency, currency);
      return response.data.converted;
    } catch (error) {
      console.error('Error converting amount:', error);
      return amount;
    }
  };

  const formatCurrency = (amount: number, fromCurrency: string = 'BOB'): string => {
    const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];
    
    return new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + currencyInfo.symbol;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      convertAmount, 
      formatCurrency,
      loading 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};