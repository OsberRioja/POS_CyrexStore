import React, { useState } from 'react';
import { X, Wrench, MonitorPlay, Truck } from 'lucide-react';
import { stockService } from '../services/stockService';

interface OutboundStockModalProps {
  product: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    provider?: { // ← Añadir proveedor al tipo del producto
      id_provider: number;
      name: string;
      phone: string;
    } | null;
  };
  type: 'repair' | 'demo';
  onClose: () => void;
  onSuccess: () => void;
}

const OutboundStockModal: React.FC<OutboundStockModalProps> = ({ 
  product, 
  type, 
  onClose, 
  onSuccess 
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRepair = type === 'repair';
  const title = isRepair ? 'Enviar a Reparación' : 'Enviar a Demo';
  const Icon = isRepair ? Wrench : MonitorPlay;
  const color = isRepair ? 'orange' : 'purple';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantity > product.stock) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    if (!reason.trim()) {
      setError('Debe proporcionar una razón');
      return;
    }

    setLoading(true);

    try {
      if (isRepair) {
        await stockService.registerRepairOut({
          productId: product.id,
          quantity,
          reason: reason.trim(),
          notes: notes.trim() || undefined
        });
      } else {
        await stockService.registerDemoOut({
          productId: product.id,
          quantity,
          reason: reason.trim(),
          notes: notes.trim() || undefined
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error registering outbound:', err);
      setError(err.response?.data?.error || 'Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Icon size={24} className={`text-${color}-600`} />
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-gray-600">{product.name}</p>
            </div>
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

          {/* Información del Proveedor - NUEVA SECCIÓN */}
          {product.provider && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-green-600" />
                <p className="text-sm font-medium text-green-800">Proveedor Vinculado</p>
              </div>
              <div className="text-sm text-green-700">
                <p className="font-medium">{product.provider.name}</p>
                <p className="text-xs">Tel: {product.provider.phone}</p>
                <p className="text-xs mt-1 text-green-600">
                  Este proveedor está asociado a este producto
                </p>
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Stock después: {product.stock - quantity} unidades
            </p>
          </div>

          {/* Razón */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isRepair ? 'Razón de Reparación' : 'Razón de Demo'} *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isRepair ? 'Ej: Pantalla rota, batería defectuosa...' : 'Ej: Cliente Empresa ABC, Demo 15 días...'}
              required
            />
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Información adicional..."
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
              className={`px-4 py-2 bg-${color}-600 text-white rounded-md hover:bg-${color}-700 disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutboundStockModal;