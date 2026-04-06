import React, { useEffect, useState } from 'react';
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
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRepair = type === 'repair';
  const title = isRepair ? 'Enviar a Reparación' : 'Enviar a Demo';
  const Icon = isRepair ? Wrench : MonitorPlay;
  const color = isRepair ? 'orange' : 'purple';

  useEffect(() => {
    const loadSerials = async () => {
      setLoadingSerials(true);
      try {
        const response = await stockService.getAvailableSerials(product.id);
        const serials = (response.data?.data ?? []).map((item: any) => item.serialNumber);
        setAvailableSerials(serials);
        if (serials.length > 0) {
          setSelectedSerials([serials[0]]);
        }
      } catch (err) {
        setError('No se pudieron cargar los números de serie disponibles');
      } finally {
        setLoadingSerials(false);
      }
    };

    loadSerials();
  }, [product.id]);

  const updateSerialSelection = (index: number, value: string) => {
    setSelectedSerials((prev) => {
      const next = [...prev];
      next[index] = value;
      return next.filter(Boolean);
    });
  };

  const addSerialSelector = () => {
    const remaining = availableSerials.filter((serial) => !selectedSerials.includes(serial));
    if (remaining.length === 0) return;
    setSelectedSerials((prev) => [...prev, remaining[0]]);
  };

  const removeSerialSelector = (index: number) => {
    setSelectedSerials((prev) => prev.filter((_, i) => i !== index));
  };

  const getSelectableSerials = (current?: string) =>
    availableSerials.filter((serial) => serial === current || !selectedSerials.includes(serial));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedSerials.length === 0) {
      setError('Debe seleccionar al menos un número de serie');
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
          quantity: selectedSerials.length,
          reason: reason.trim(),
          serialNumbers: selectedSerials,
          notes: notes.trim() || undefined
        });
      } else {
        await stockService.registerDemoOut({
          productId: product.id,
          quantity: selectedSerials.length,
          reason: reason.trim(),
          serialNumbers: selectedSerials,
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

          {/* Series */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ítems / Números de serie *
            </label>
            {loadingSerials ? (
              <p className="text-sm text-gray-500">Cargando series disponibles...</p>
            ) : availableSerials.length === 0 ? (
              <p className="text-sm text-red-600">No hay series disponibles para este producto</p>
            ) : (
              <div className="space-y-2">
                {selectedSerials.map((selectedSerial, idx) => (
                  <div key={`serial-${idx}`} className="flex gap-2">
                    <select
                      value={selectedSerial}
                      onChange={(e) => updateSerialSelection(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {getSelectableSerials(selectedSerial).map((serial) => (
                        <option key={serial} value={serial}>
                          {serial}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSerialSelector(idx)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md border"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSerialSelector}
                  disabled={selectedSerials.length >= availableSerials.length}
                  className="text-sm px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  + Agregar ítem por serie
                </button>
                <p className="text-xs text-gray-500">
                  Seleccionados: {selectedSerials.length} | Stock después: {product.stock - selectedSerials.length}
                </p>
              </div>
            )}
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
