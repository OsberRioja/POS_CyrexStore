import { useState, useEffect } from 'react';
import { RefreshCw, Edit2, Save, X, TrendingUp } from 'lucide-react';
import { exchangeRateService } from '../services/exchangeRateService';

export default function ExchangeRateManager() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const response = await exchangeRateService.listAll();
      setRates(response.data || []);
    } catch (error) {
      console.error('Error loading rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromAPI = async () => {
    setUpdating(true);
    try {
      await exchangeRateService.updateFromAPI();
      await loadRates();
      alert('✅ Tasas actualizadas desde la API');
    } catch (error) {
      console.error('Error updating from API:', error);
      alert('❌ Error al actualizar tasas');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (rate: any) => {
    const key = `${rate.fromCurrency}-${rate.toCurrency}`;
    setEditingRate(key);
    setEditValue(rate.manualRate?.toString() || rate.rate.toString());
    setEditNotes(rate.notes || '');
  };

  const handleSaveManual = async (rate: any) => {
    try {
      const newRate = parseFloat(editValue);
      if (isNaN(newRate) || newRate <= 0) {
        alert('La tasa debe ser un número mayor a 0');
        return;
      }

      await exchangeRateService.updateManual(
        rate.fromCurrency,
        rate.toCurrency,
        newRate,
        editNotes || undefined
      );

      await loadRates();
      setEditingRate(null);
      alert('✅ Tasa actualizada');
    } catch (error) {
      console.error('Error saving manual rate:', error);
      alert('❌ Error al guardar tasa');
    }
  };

  const handleToggleManual = async (rate: any) => {
    try {
      await exchangeRateService.toggleManual(
        rate.fromCurrency,
        rate.toCurrency,
        !rate.useManual
      );
      await loadRates();
    } catch (error) {
      console.error('Error toggling manual rate:', error);
      alert('❌ Error al cambiar tipo de tasa');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <RefreshCw size={48} className="mx-auto mb-4 text-gray-400 animate-spin" />
        <p className="text-gray-600">Cargando tasas de cambio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tasas de Cambio</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra las tasas de conversión entre monedas
          </p>
        </div>
        <button
          onClick={handleUpdateFromAPI}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={20} className={updating ? 'animate-spin' : ''} />
          Actualizar desde API
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp size={20} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Sobre las tasas de cambio:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>API (Automática):</strong> Se actualiza diariamente a las 8:00 AM con tasas oficiales</li>
              <li><strong>Manual (Paralelo):</strong> Ingresa la tasa del mercado paralelo boliviano</li>
              <li><strong>Recomendación:</strong> Usa tasa manual para USD/BOB (paralelo)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">De → A</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tasa Actual</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tasa API</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tasa Manual</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Act.</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rates.map((rate) => {
              const key = `${rate.fromCurrency}-${rate.toCurrency}`;
              const isEditing = editingRate === key;

              return (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{rate.fromCurrency}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold text-gray-900">{rate.toCurrency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-blue-600">
                      {rate.rate.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    {rate.apiRate ? rate.apiRate.toFixed(4) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32 mx-auto px-2 py-1 border rounded text-center"
                          placeholder="Tasa"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Notas (opcional)"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-700">
                        {rate.manualRate ? rate.manualRate.toFixed(4) : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="flex items-center justify-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rate.useManual}
                        onChange={() => handleToggleManual(rate)}
                        disabled={!rate.manualRate}
                        className="w-4 h-4"
                      />
                      <span className={`text-xs font-semibold ${
                        rate.useManual ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {rate.useManual ? 'Manual' : 'API'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(rate.lastUpdated)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveManual(rate)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Guardar"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingRate(null)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(rate)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar tasa manual"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}