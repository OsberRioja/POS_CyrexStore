import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { stockService } from '../services/stockService';
import axios from 'axios';

interface PurchaseStockModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PurchaseStockModal: React.FC<PurchaseStockModalProps> = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(product?.costPrice || 0);
  const [providerId, setProviderId] = useState<number | undefined>(product?.providerId || undefined);
  const [notes, setNotes] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data || []);
    } catch (err) {
      console.error('Error loading providers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (unitCost < 0) {
      setError('El costo unitario no puede ser negativo');
      return;
    }

    setLoading(true);

    try {
      await stockService.registerPurchase({
        productId: product.id,
        quantity,
        unitCost,
        providerId,
        notes: notes.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error registering purchase:', err);
      setError(err.response?.data?.error || 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = quantity * unitCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold">Registrar Compra de Stock</h2>
            <p className="text-sm text-gray-600">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Stock actual */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Stock Actual</p>
            <p className="text-2xl font-bold text-blue-600">{product.stock} unidades</p>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a Comprar *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nuevo stock: {product.stock + quantity} unidades
            </p>
          </div>

          {/* Costo unitario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo Unitario (Bs) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Total */}
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Costo Total</p>
            <p className="text-2xl font-bold text-green-600">
              Bs. {totalCost.toFixed(2)}
            </p>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor
            </label>
            <select
              value={providerId || ''}
              onChange={(e) => setProviderId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin proveedor</option>
              {providers.map((provider) => (
                <option key={provider.id_provider} value={provider.id_provider}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ej: Factura #12345, Lote A..."
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
              {loading ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseStockModal;