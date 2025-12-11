import React, { useState } from 'react';
import { X } from 'lucide-react';
import { stockService } from '../services/stockService';
import { useAuth } from '../context/authContext';

// Importa el CSS de react-datepicker
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';

interface InternalUseModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const InternalUseModal: React.FC<InternalUseModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    quantity: 1,
    reason: '',
    destination: '',
    expectedReturnDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setError('La razón es obligatoria');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await stockService.registerInternalUseOut({
        productId: product.id,
        quantity: form.quantity,
        reason: form.reason,
        destination: form.destination || undefined,
        expectedReturnDate: form.expectedReturnDate || undefined,
        notes: form.notes
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar uso interno');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fijo */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registrar Uso Interno</h2>
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
          <form onSubmit={handleSubmit} id="internal-use-form" className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={form.quantity}
                onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo disponible: {product.stock}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón / Justificación *
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Ej: Para evento de lanzamiento, taller interno, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino (opcional)
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => setForm({...form, destination: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Sala de conferencias, Sede central, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha esperada de retorno (opcional)
              </label>
              
              {/* SOLUCIÓN 1: Usando DatePicker con configuración mejorada */}
              <div className="relative">
                <DatePicker
                  selected={form.expectedReturnDate ? new Date(form.expectedReturnDate) : null}
                  onChange={(date) => {
                    if (date) {
                      // Formatear como YYYY-MM-DD para el backend
                      const formattedDate = date.toISOString().split('T')[0];
                      setForm({...form, expectedReturnDate: formattedDate});
                    } else {
                      setForm({...form, expectedReturnDate: ''});
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Seleccionar fecha"
                  minDate={new Date()}
                  isClearable
                  showPopperArrow={false}
                  popperClassName="z-[100]" // Asegurar que esté por encima del modal
                  popperPlacement="bottom-start"
                  wrapperClassName="w-full"
                />
              </div>
              
              {/* SOLUCIÓN ALTERNATIVA: Input nativo (más simple) */}
              {/* 
              <div className="relative">
                <input
                  type="date"
                  value={form.expectedReturnDate}
                  onChange={(e) => setForm({...form, expectedReturnDate: e.target.value})}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                />
              </div>
              */}
              
              <p className="text-xs text-gray-500 mt-1">
                Seleccione una fecha futura para el retorno esperado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
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

        {/* Footer fijo */}
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
              form="internal-use-form"
              disabled={loading || !form.reason.trim() || form.quantity < 1 || form.quantity > product.stock}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registrando...' : 'Confirmar Uso Interno'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalUseModal;