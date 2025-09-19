import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { paymentMethodService } from '../services/paymentMethodService';
import { saleService } from '../services/saleService';

interface Sale {
  id: string;
  total: number;
  totalPaid: number;
  balance: number;
  paymentStatus: string;
  client?: { nombre: string; telefono: string };
}

interface PaymentMethod {
  id: number;
  name: string;
  isCash: boolean;
}

interface AddPaymentModalProps {
  sale: Sale;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ sale, onClose, onSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPaymentMethods();
    // Pre-llenar con el saldo pendiente
    setAmount(sale.balance.toFixed(2));
  }, [sale.balance]);

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodService.list();
      const methods = Array.isArray(response) ? response : response.data || [];
      setPaymentMethods(methods);
      
      // Pre-seleccionar el primer método disponible
      if (methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Ingrese un monto válido mayor a 0');
      return;
    }

    if (paymentAmount > sale.balance) {
      setError(`El monto no puede ser mayor al saldo pendiente (${formatCurrency(sale.balance)})`);
      return;
    }

    if (!selectedMethodId) {
      setError('Seleccione un método de pago');
      return;
    }

    setLoading(true);
    try {
      await saleService.addPayment(sale.id, {
        paymentMethodId: selectedMethodId,
        amount: paymentAmount
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding payment:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Error al procesar el pago';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir solo números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const setFullBalance = () => {
    setAmount(sale.balance.toFixed(2));
    setError('');
  };

  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Completar Pago</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Sale Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Información de la Venta</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span>{sale.client?.nombre || 'Cliente General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total venta:</span>
                <span className="font-semibold">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ya pagado:</span>
                <span className="text-green-600">{formatCurrency(sale.totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span className="text-red-600">Saldo pendiente:</span>
                <span className="text-red-600">{formatCurrency(sale.balance)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                id="paymentMethod"
                value={selectedMethodId}
                onChange={(e) => setSelectedMethodId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Seleccionar método...</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} {method.isCash ? '(Efectivo)' : '(No efectivo)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Monto del Pago
                </label>
                <button
                  type="button"
                  onClick={setFullBalance}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Pagar todo el saldo
                </button>
              </div>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {formatCurrency(sale.balance)}
              </p>
            </div>

            {selectedMethod && selectedMethod.isCash && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  <strong>Pago en efectivo:</strong> Asegúrese de tener la caja abierta.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;