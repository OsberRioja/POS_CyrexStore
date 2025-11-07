// src/components/CompleteRepairModal.tsx
import React, { useState } from 'react';
import { X, CheckCircle, Truck } from 'lucide-react';
import { stockService } from '../services/stockService';

interface CompleteRepairModalProps {
  repair: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CompleteRepairModal: React.FC<CompleteRepairModalProps> = ({ 
  repair, 
  onClose, 
  onSuccess 
}) => {
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resolution.trim()) {
      setError('Debe describir la resolución de la reparación');
      return;
    }

    setLoading(true);

    try {
      await stockService.completeRepair(repair.id, {
        resolution: resolution.trim(),
        notes: notes.trim() || undefined
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error completing repair:', err);
      setError(err.response?.data?.error || 'Error al finalizar la reparación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600" />
            <div>
              <h2 className="text-xl font-bold">Finalizar Reparación</h2>
              <p className="text-sm text-gray-600">{repair.product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Información de la reparación */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Información de la Reparación</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Producto:</span>
                <p className="font-medium">{repair.product.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Cantidad:</span>
                <p className="font-medium">{Math.abs(repair.quantity)} unidades</p>
              </div>
              <div>
                <span className="text-gray-600">Razón original:</span>
                <p className="font-medium">{repair.reason}</p>
              </div>
              <div>
                <span className="text-gray-600">Enviado por:</span>
                <p className="font-medium">{repair.user.name}</p>
              </div>
            </div>
          </div>

          {repair.provider && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Truck size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Proveedor: {repair.provider.name}</p>
                {repair.product.provider && repair.product.provider.id_provider !== repair.provider.id_provider && (
                  <p className="text-xs text-green-600">(Proveedor original del producto)</p>
                )}
              </div>
            </div>
          )}

          {/* Resolución */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolución de la Reparación *
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describa el trabajo realizado, piezas reemplazadas, estado final..."
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
              rows={2}
              placeholder="Información adicional, observaciones..."
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? 'Finalizando...' : (
                <>
                  <CheckCircle size={16} />
                  Finalizar Reparación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteRepairModal;