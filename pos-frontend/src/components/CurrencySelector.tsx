import { useState } from 'react';
import { DollarSign, Check } from 'lucide-react';
import { useCurrency } from '../context/currencyContext';

const CURRENCIES = [
  { code: 'BOB', symbol: 'Bs.', name: 'Bolivianos', flag: '🇧🇴' },
  { code: 'USD', symbol: '$', name: 'Dólares', flag: '🇺🇸' },
  { code: 'CNY', symbol: '¥', name: 'Yuanes', flag: '🇨🇳' }
];

export default function CurrencySelector() {
  const { currency, setCurrency, loading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleSelect = async (code: string) => {
    if (code === currency) {
      setIsOpen(false);
      return;
    }

    setSaving(true);
    try {
      await setCurrency(code);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing currency:', error);
      alert('Error al cambiar la moneda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <DollarSign size={20} className="text-gray-400" />
        <span className="text-sm text-gray-400">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={saving}
      >
        <DollarSign size={20} className="text-gray-600" />
        <span className="text-2xl">{currentCurrency.flag}</span>
        <div className="text-left">
          <div className="text-xs text-gray-500">Moneda</div>
          <div className="text-sm font-semibold text-gray-900">
            {currentCurrency.symbol} {currentCurrency.code}
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Seleccionar Moneda
              </div>
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleSelect(curr.code)}
                  disabled={saving}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    curr.code === currency
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{curr.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{curr.name}</div>
                      <div className="text-xs text-gray-500">
                        {curr.symbol} {curr.code}
                      </div>
                    </div>
                  </div>
                  {curr.code === currency && (
                    <Check size={20} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}