// components/CurrencySelector.tsx - VERSIÓN COMPATIBLE
import { useState, useRef, useEffect } from 'react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Encontrar la moneda actual de forma segura
  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleSelect = async (code: string) => {
    if (code === currency || saving) {
      setIsOpen(false);
      return;
    }

    setSaving(true);
    try {
      await setCurrency(code);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing currency:', error);
      // No mostrar alert para no interrumpir la experiencia
    } finally {
      setSaving(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <DollarSign size={16} className="text-gray-400" />
        <div className="text-left">
          <div className="text-xs text-gray-400">Moneda</div>
          <div className="text-sm text-gray-400">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={saving}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
          ${saving 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        <DollarSign size={16} className={saving ? "text-gray-400" : "text-gray-600"} />
        <span className="text-xl">{currentCurrency.flag}</span>
        <div className="text-left">
          <div className="text-xs text-gray-500">Moneda</div>
          <div className={`text-sm font-semibold ${saving ? 'text-gray-400' : 'text-gray-900'}`}>
            {currentCurrency.symbol} {currentCurrency.code}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${saving ? 'text-gray-400' : 'text-gray-500'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
              Seleccionar Moneda
            </div>
            {CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleSelect(curr.code)}
                disabled={saving}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors mb-1
                  ${curr.code === currency
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                  ${saving ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{curr.flag}</span>
                  <div className="text-left">
                    <div className="font-medium">{curr.name}</div>
                    <div className="text-xs text-gray-500">
                      {curr.symbol} {curr.code}
                    </div>
                  </div>
                </div>
                {curr.code === currency && (
                  <Check size={16} className="text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}