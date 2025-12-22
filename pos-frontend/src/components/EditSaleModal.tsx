import React, { useState, useEffect } from 'react';
import { saleEditService } from '../services/saleEditService';
import { productService } from '../services/productService';
import { clientService } from '../services/clientService';
import { paymentMethodService } from '../services/paymentMethodService';

interface EditSaleModalProps {
  sale: any;
  cashboxId: number;
  branchId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  originalCurrency?: string;
  conversionRate?: number;
}

interface FormPayment {
  paymentMethodId: number;
  amount: number;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  sale,
  branchId,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<{
    items: FormItem[];
    payments: FormPayment[];
    client?: any;
    allowPartialPayment?: boolean;
  }>({
    items: (sale.items || []).map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      originalPrice: item.originalPrice || item.unitPrice,
      originalCurrency: item.originalCurrency || 'BOB',
      conversionRate: item.conversionRate || 1
    })),
    payments: (sale.payments || []).map((payment: any) => ({
      paymentMethodId: payment.paymentMethodId,
      amount: payment.amount
    })),
    client: sale.client,
    allowPartialPayment: sale.paymentStatus === 'PARTIAL'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar productos usando getAll
      const productsRes = await productService.getAll({ branchId });
      // Manejar diferentes estructuras de respuesta
      const productsData = productsRes.data?.data || productsRes.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);

      // Cargar clientes usando getClients
      const clientsRes = await clientService.getClients({ page: 1, limit: 100 });
      const clientsData = clientsRes.data?.data || clientsRes.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);

      // Cargar métodos de pago usando list
      const paymentMethodsRes = await paymentMethodService.list();
      const paymentMethodsData = paymentMethodsRes.data || [];
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : []);
    } catch (err) {
      console.error('Error loading data:', err);
      // Si falla paymentMethodService.list, intentar cargar de otra manera
      if (err) {
        try {
          const backupPaymentMethods = [
            { id: 1, name: 'EFECTIVO', isCash: true },
            { id: 2, name: 'TARJETA', isCash: false },
            { id: 3, name: 'TRANSFERENCIA', isCash: false },
            { id: 4, name: 'QR', isCash: false }
          ];
          setPaymentMethods(backupPaymentMethods);
        } catch (e) {
          console.error('Error loading backup payment methods:', e);
        }
      }
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Si cambia el precio unitario, actualizar también el precio original
    if (field === 'unitPrice') {
      newItems[index].originalPrice = value;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          quantity: 1,
          unitPrice: 0,
          originalPrice: 0,
          originalCurrency: 'BOB',
          conversionRate: 1
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handlePaymentChange = (index: number, field: string, value: any) => {
    const newPayments = [...formData.payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setFormData({ ...formData, payments: newPayments });
  };

  const calculateTotal = (): number => {
    return formData.items.reduce((sum: number, item: FormItem) => 
      sum + (Number(item.quantity) * Number(item.unitPrice)), 0
    );
  };

  const calculateTotalPaid = (): number => {
    return formData.payments.reduce((sum: number, payment: FormPayment) => 
      sum + Number(payment.amount), 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      const total = calculateTotal();
      const totalPaid = calculateTotalPaid();
      
      if (total <= 0) {
        throw new Error('El total debe ser mayor a 0');
      }

      if (totalPaid < 0) {
        throw new Error('El monto pagado no puede ser negativo');
      }

      if (totalPaid > total && !formData.allowPartialPayment) {
        throw new Error('El monto pagado no puede ser mayor al total');
      }

      // Preparar datos para enviar
      const dataToSend = {
        items: formData.items,
        payments: formData.payments,
        client: formData.client,
        allowPartialPayment: formData.allowPartialPayment,
        branchId
      };

      await saleEditService.update(sale.id, dataToSend);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating sale:', err);
      setError(err.response?.data?.error || err.message || 'Error al actualizar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Venta #{sale.id?.substring(0, 8) || 'N/A'}</h2>
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
          {/* Items de la venta */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Productos</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Agregar Producto
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Stock: {product.stock} - Bs. {product.salePrice}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div className="w-24">
                    <div className="text-center font-semibold">
                      Bs. {(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    disabled={formData.items.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pagos */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Pagos</h3>
            <div className="space-y-3">
              {formData.payments.map((payment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <select
                      value={payment.paymentMethodId}
                      onChange={(e) => handlePaymentChange(index, 'paymentMethodId', parseInt(e.target.value))}
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
                  
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => handlePaymentChange(index, 'amount', parseFloat(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newPayments = formData.payments.filter((_, i) => i !== index);
                      setFormData({ ...formData, payments: newPayments });
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    disabled={formData.payments.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="mb-6 p-4 bg-blue-50 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Venta:</div>
                <div className="text-xl font-bold">Bs. {calculateTotal().toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Pagado:</div>
                <div className="text-xl font-bold">Bs. {calculateTotalPaid().toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Saldo:</div>
                <div className={`text-xl font-bold ${
                  calculateTotal() - calculateTotalPaid() > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  Bs. {(calculateTotal() - calculateTotalPaid()).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowPartialPayment || false}
                    onChange={(e) => setFormData({...formData, allowPartialPayment: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Permitir pago parcial</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
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