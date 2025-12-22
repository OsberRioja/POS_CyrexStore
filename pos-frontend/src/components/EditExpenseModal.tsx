import React, { useState, useEffect } from 'react';
import { expenseEditService } from '../services/expenseEditService';
import { paymentMethodService } from '../services/paymentMethodService';

interface EditExpenseModalProps {
  expense: any;
  cashboxId: number;
  branchId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  //cashboxId,
  branchId,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    amount: expense.amount || 0,
    concept: expense.concept || '',
    paymentMethodId: expense.paymentMethodId || 0,
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const paymentMethodsRes = await paymentMethodService.list();
      const paymentMethodsData = paymentMethodsRes.data || [];
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : []);
    } catch (err) {
      console.error('Error loading payment methods:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.concept.trim()) {
        throw new Error('El concepto es requerido');
      }

      if (formData.amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      if (!formData.paymentMethodId) {
        throw new Error('Seleccione un método de pago');
      }

      await expenseEditService.update(expense.id, {
        ...formData,
        branchId
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating expense:', err);
      setError(err.response?.data?.error || err.message || 'Error al actualizar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Gasto</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Concepto *</label>
              <input
                type="text"
                value={formData.concept}
                onChange={(e) => setFormData({...formData, concept: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monto (Bs.) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Método de Pago *</label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData({...formData, paymentMethodId: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Seleccionar método</option>
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};