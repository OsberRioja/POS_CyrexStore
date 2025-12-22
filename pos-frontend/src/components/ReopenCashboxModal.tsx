import React, { useState } from 'react';
import { cashboxService } from '../services/cashboxService';
//import { useAuth } from '../context/authContext';

interface ReopenCashboxModalProps {
  cashbox: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReopenCashboxModal: React.FC<ReopenCashboxModalProps> = ({
  cashbox,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  //const { user } = useAuth();

  const handleReopen = async () => {
    if (confirmText !== 'REABRIR') {
      setError('Debes escribir "REABRIR" para confirmar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await cashboxService.reopen(cashbox.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reabrir la caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reabrir Caja #{cashbox.id}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-semibold mb-2">⚠️ Advertencia Importante</p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Esta acción reabrirá una caja ya cerrada</li>
            <li>• Solo se permite para corregir errores en ventas o gastos</li>
            <li>• No se volverá a contar el efectivo</li>
            <li>• Puede haber otra caja abierta en esta sucursal</li>
            <li>• Los reportes se actualizarán con los cambios realizados</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Información de la Caja</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sucursal:</span>
              <span>{cashbox.branch?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Abierta por:</span>
              <span>{cashbox.openedByUser?.name} (#{cashbox.openedByUser?.userCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cerrada por:</span>
              <span>{cashbox.closedByUser?.name} (#{cashbox.closedByUser?.userCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monto Inicial:</span>
              <span>Bs. {cashbox.initialAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monto de Cierre:</span>
              <span>Bs. {cashbox.realClosedAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Para confirmar, escribe <span className="font-bold text-red-600">REABRIR</span>:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            className="w-full p-2 border border-gray-300 rounded uppercase"
            placeholder="REABRIR"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleReopen}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            disabled={loading || confirmText !== 'REABRIR'}
          >
            {loading ? 'Reabriendo...' : 'Reabrir Caja'}
          </button>
        </div>
      </div>
    </div>
  );
};