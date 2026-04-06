import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { stockService } from '../services/stockService';
import { branchService } from '../services/branchService';

interface TransferBetweenBranchesModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferBetweenBranchesModal: React.FC<TransferBetweenBranchesModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const [branches, setBranches] = useState<any[]>([]);
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [destinationBranchId, setDestinationBranchId] = useState<number | ''>('');
  const [reason, setReason] = useState('Transferencia entre tiendas');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitialData(true);
      try {
        const [branchesResponse, serialsResponse] = await Promise.all([
          branchService.getAll(),
          stockService.getAvailableSerials(product.id)
        ]);

        const allBranches = branchesResponse.data ?? [];
        const destinationOptions = allBranches.filter((branch: any) => branch.id !== product.branchId && branch.isActive);
        setBranches(destinationOptions);

        const serials = (serialsResponse.data?.data ?? []).map((item: any) => item.serialNumber);
        setAvailableSerials(serials);
        if (serials.length > 0) {
          setSelectedSerials([serials[0]]);
        }
      } catch (err) {
        setError('No se pudieron cargar las sucursales o series disponibles');
      } finally {
        setLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [product.id, product.branchId]);

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

    if (!destinationBranchId) {
      setError('Debe seleccionar una sucursal destino');
      return;
    }

    if (!reason.trim()) {
      setError('Debe indicar la razón de la transferencia');
      return;
    }

    if (selectedSerials.length === 0) {
      setError('Debe seleccionar al menos una serie para transferir');
      return;
    }

    setLoading(true);

    try {
      await stockService.registerTransferBetweenBranches({
        productId: product.id,
        destinationBranchId: Number(destinationBranchId),
        quantity: selectedSerials.length,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        serialNumbers: selectedSerials
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transferencia entre tiendas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {product.name} ({product.sku})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <form id="branch-transfer-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal destino *</label>
              <select
                value={destinationBranchId}
                onChange={(e) => setDestinationBranchId(Number(e.target.value) || '')}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccione sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Series a transferir *</label>
              {loadingInitialData ? (
                <p className="text-sm text-gray-500">Cargando datos...</p>
              ) : availableSerials.length === 0 ? (
                <p className="text-sm text-red-600">No hay series disponibles para transferir</p>
              ) : (
                <div className="space-y-2">
                  {selectedSerials.map((selectedSerial, idx) => (
                    <div key={`transfer-serial-${idx}`} className="flex gap-2">
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
                    + Agregar serie
                  </button>
                  <p className="text-xs text-gray-500">Total ítems seleccionados: {selectedSerials.length}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50 flex-shrink-0 flex justify-end gap-3">
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
            form="branch-transfer-form"
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50"
            disabled={loading || loadingInitialData || selectedSerials.length === 0 || !destinationBranchId}
          >
            {loading ? 'Transfiriendo...' : 'Confirmar transferencia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferBetweenBranchesModal;
