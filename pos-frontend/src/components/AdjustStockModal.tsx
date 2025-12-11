import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { stockService } from '../services/stockService';
import { useAuth } from '../context/authContext';

interface AdjustStockModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    quantity: 1,
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setError('La justificación es obligatoria');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await stockService.registerAdjustment({
        productId: product.id,
        quantity: form.quantity,
        reason: form.reason,
        notes: form.notes
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar ajuste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajuste de Stock</h2>
            <p className="text-sm text-gray-600 mt-1">
              {product.name} - Stock actual: <span className="font-bold">{product.stock}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad de ajuste *
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 5 (aumento) o -3 (disminución)"
                  />
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Nuevo stock: <span className="font-bold">
                    {product.stock + form.quantity}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Positivo para aumentar, negativo para disminuir
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justificación *
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ej: Conteo físico, producto dañado, pérdida reportada..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Información adicional..."
              />
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Registrado por:</span> {user?.name} (#{user?.userCode})
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || form.quantity === 0 || !form.reason.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registrando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustStockModal;