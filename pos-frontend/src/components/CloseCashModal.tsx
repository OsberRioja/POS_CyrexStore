import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useCurrency } from '../context/currencyContext';

interface CloseCashboxModalProps {
  cashbox: any;
  closePreview: any;
  onClose: () => void;
  onConfirm: (data: { cashCount: any; notes?: string }) => Promise<void>;
}

// Denominaciones en bolivianos
const DENOMINATIONS = [
  { value: 200, label: 'Bs. 200', type: 'bill' },
  { value: 100, label: 'Bs. 100', type: 'bill' },
  { value: 50, label: 'Bs. 50', type: 'bill' },
  { value: 20, label: 'Bs. 20', type: 'bill' },
  { value: 10, label: 'Bs. 10', type: 'bill' },
  { value: 5, label: 'Bs. 5', type: 'coin' },
  { value: 2, label: 'Bs. 2', type: 'coin' },
  { value: 1, label: 'Bs. 1', type: 'coin' },
  { value: 0.5, label: 'Bs. 0.50', type: 'coin' },
  { value: 0.2, label: 'Bs. 0.20', type: 'coin' },
  { value: 0.1, label: 'Bs. 0.10', type: 'coin' },
];

const CloseCashboxModal: React.FC<CloseCashboxModalProps> = ({ 
  cashbox,
  closePreview, 
  onClose, 
  onConfirm 
}) => {
  console.log('🔍 Modal - cashbox:', cashbox);
  console.log('🔍 Modal - closePreview:', closePreview);
  const [step, setStep] = useState<'count' | 'summary'>('count');
  const [counts, setCounts] = useState<{ [key: number]: number }>(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {})
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NUEVO: Usar el hook de divisas
  const { formatCurrency } = useCurrency();

  // Calcular totales
  const countedTotal = DENOMINATIONS.reduce(
    (sum, d) => sum + (counts[d.value] || 0) * d.value,
    0
  );

  const expectedCash = closePreview?.report?.expectedClosedAmount || 0;
  console.log('🔍 Modal - expectedCash value:', expectedCash);
  console.log('🔍 Modal - closePreview structure:', closePreview);
  const difference = countedTotal - expectedCash;
  const tolerance = 0.5; // Tolerancia de 0.50 Bs

  // ELIMINADO: La función formatCurrency local ya no es necesaria
  /*
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  */

  const handleCountChange = (value: number, count: number) => {
    setCounts(prev => ({ ...prev, [value]: Math.max(0, count) }));
  };

  const handleQuickAdd = (value: number, amount: number) => {
    setCounts(prev => ({ ...prev, [value]: (prev[value] || 0) + amount }));
  };

  const handleClearAll = () => {
    if (confirm('¿Limpiar todos los valores?')) {
      setCounts(DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {}));
    }
  };

  const handleNextStep = () => {
    setStep('summary');
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({
        cashCount: {
          denominations: counts,
          total: countedTotal,
          expectedTotal: expectedCash,
          difference: difference,
          timestamp: new Date().toISOString()
        },
        notes: notes.trim() || undefined
      });
    } catch (error) {
      console.error('Error closing cashbox:', error);
      alert('Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const bills = DENOMINATIONS.filter(d => d.type === 'bill');
  const coins = DENOMINATIONS.filter(d => d.type === 'coin');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold">Cerrar Caja #{cashbox.id}</h2>
            <p className="text-sm text-gray-600">
              {step === 'count' ? 'Paso 1: Conteo de Efectivo' : 'Paso 2: Verificación y Cierre'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'count' ? (
            // PASO 1: CONTEO
            <div className="space-y-6">
              {/* Resumen rápido */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Contado:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(countedTotal)} {/* CAMBIADO: usar formatCurrency del contexto */}
                  </span>
                </div>
              </div>

              {/* Billetes */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">💵 Billetes</h3>
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Limpiar todo
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bills.map((denom) => {
                    const subtotal = (counts[denom.value] || 0) * denom.value;
                    return (
                      <div key={denom.value} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">{denom.label}</span>
                          <span className="text-sm text-gray-600">
                            = {formatCurrency(subtotal)} {/* CAMBIADO */}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={counts[denom.value] || ''}
                            onChange={(e) => handleCountChange(denom.value, Number(e.target.value))}
                            className="flex-1 px-3 py-2 border rounded-md text-center text-lg font-semibold"
                            placeholder="0"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleQuickAdd(denom.value, 1)}
                              className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-semibold"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleQuickAdd(denom.value, 5)}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monedas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">🪙 Monedas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coins.map((denom) => {
                    const subtotal = (counts[denom.value] || 0) * denom.value;
                    return (
                      <div key={denom.value} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{denom.label}</span>
                          <span className="text-sm text-gray-600">
                            = {formatCurrency(subtotal)} {/* CAMBIADO */}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={counts[denom.value] || ''}
                            onChange={(e) => handleCountChange(denom.value, Number(e.target.value))}
                            className="flex-1 px-3 py-2 border rounded-md text-center font-semibold"
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleQuickAdd(denom.value, 5)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                  Continuar a Verificación →
                </button>
              </div>
            </div>
          ) : (
            // PASO 2: RESUMEN Y CONFIRMACIÓN
            <div className="space-y-6">
              {/* Estado del cuadre */}
              <div className={`p-6 rounded-lg border-2 ${
                Math.abs(difference) <= tolerance
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {Math.abs(difference) <= tolerance ? (
                    <>
                      <CheckCircle size={32} className="text-green-600" />
                      <div>
                        <h3 className="text-xl font-bold text-green-800">¡Caja Cuadrada!</h3>
                        <p className="text-sm text-green-700">El efectivo coincide con lo esperado</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={32} className="text-red-600" />
                      <div>
                        <h3 className="text-xl font-bold text-red-800">Diferencia Detectada</h3>
                        <p className="text-sm text-red-700">
                          {difference > 0 ? 'Hay más efectivo del esperado' : 'Falta efectivo en caja'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Comparación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Efectivo Esperado</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(expectedCash)} {/* CAMBIADO */}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Efectivo Contado</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(countedTotal)} {/* CAMBIADO */}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Diferencia</p>
                    <p className={`text-2xl font-bold ${
                      Math.abs(difference) <= tolerance 
                        ? 'text-green-600' 
                        : difference > 0 
                          ? 'text-orange-600' 
                          : 'text-red-600'
                    }`}>
                      {difference > 0 ? '+' : ''}{formatCurrency(difference)} {/* CAMBIADO */}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalle del conteo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Detalle del Conteo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DENOMINATIONS.filter(d => counts[d.value] > 0).map((denom) => (
                    <div key={denom.value} className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">{denom.label}</p>
                      <p className="font-semibold">
                        {counts[denom.value]} × {denom.label} = {formatCurrency(counts[denom.value] * denom.value)} {/* CAMBIADO */}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas o Observaciones (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Ej: Faltaron 2 bolivianos, cliente pagó con billete roto..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-between gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep('count')}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  disabled={loading}
                >
                  ← Volver a Contar
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloseCashboxModal;