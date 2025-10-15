import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { stockService } from '../services/stockService';

interface UpdatePricesModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdatePricesModal: React.FC<UpdatePricesModalProps> = ({ product, onClose, onSuccess }) => {
  const [costPrice, setCostPrice] = useState<string>(product.costPrice.toString());
  const [salePrice, setSalePrice] = useState<string>(product.salePrice.toString());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newCostPrice = parseFloat(costPrice);
    const newSalePrice = parseFloat(salePrice);

    if (isNaN(newCostPrice) || newCostPrice < 0) {
      setError('El precio de costo debe ser un número válido');
      return;
    }

    if (isNaN(newSalePrice) || newSalePrice < 0) {
      setError('El precio de venta debe ser un número válido');
      return;
    }

    if (newSalePrice < newCostPrice) {
      const confirmed = confirm(
        '⚠️ ADVERTENCIA:\n\n' +
        'El precio de venta es menor que el precio de costo.\n' +
        'Esto generará pérdidas.\n\n' +
        '¿Deseas continuar?'
      );
      if (!confirmed) return;
    }

    // Verificar si hubo cambios
    if (newCostPrice === product.costPrice && newSalePrice === product.salePrice) {
      setError('No hay cambios en los precios');
      return;
    }

    setLoading(true);

    try {
      await stockService.updatePrices(product.id, {
        costPrice: newCostPrice !== product.costPrice ? newCostPrice : undefined,
        salePrice: newSalePrice !== product.salePrice ? newSalePrice : undefined,
        notes: notes.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating prices:', err);
      setError(err.response?.data?.error || 'Error al actualizar los precios');
    } finally {
      setLoading(false);
    }
  };

  const margin = ((parseFloat(salePrice) - parseFloat(costPrice)) / parseFloat(costPrice) * 100).toFixed(2);
  const profit = parseFloat(salePrice) - parseFloat(costPrice);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <DollarSign size={24} className="text-green-600" />
            <div>
              <h2 className="text-xl font-bold">Actualizar Precios</h2>
              <p className="text-sm text-gray-600">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Precios actuales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Precios Actuales</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Costo</p>
                <p className="text-lg font-bold text-gray-800">Bs. {product.costPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Venta</p>
                <p className="text-lg font-bold text-gray-800">Bs. {product.salePrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Precio de costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Costo (Bs) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Precio de venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Venta (Bs) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Cálculo de margen */}
          {!isNaN(parseFloat(costPrice)) && !isNaN(parseFloat(salePrice)) && (
            <div className={`p-4 rounded-lg ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Ganancia</p>
                  <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Bs. {profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Margen</p>
                  <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margin}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del Cambio (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Ej: Ajuste por inflación, promoción..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Precios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePricesModal;