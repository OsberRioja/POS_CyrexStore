import React from 'react';
import { X } from 'lucide-react';

interface SaleDetailsModalProps {
  sale: any;
  onClose: () => void;
}

const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({ sale, onClose }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges = {
      PAID: { text: 'Pagado', class: 'bg-green-100 text-green-800' },
      PARTIAL: { text: 'Pago Parcial', class: 'bg-yellow-100 text-yellow-800' },
      PENDING: { text: 'Pendiente', class: 'bg-red-100 text-red-800' },
      OVERPAID: { text: 'Sobrepagado', class: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Detalles de Venta</h2>
            <p className="text-sm text-gray-600">ID: {sale.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-700">Información General</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{formatDate(sale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span>{getPaymentStatusBadge(sale.paymentStatus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendedor:</span>
                  <span className="font-medium">{sale.seller?.name} (#{sale.seller?.userCode})</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-700">Cliente</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{sale.client?.nombre || 'Cliente General'}</span>
                </div>
                {sale.client?.telefono && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium">{sale.client.telefono}</span>
                  </div>
                )}
                {sale.client?.tipo_cliente && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{sale.client.tipo_cliente}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Productos */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-700">Productos</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sale.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product?.name || 'Producto'}</div>
                        {item.product?.sku && (
                          <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagos */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-700">Métodos de Pago</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sale.payments?.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{payment.paymentMethod?.name || 'N/A'}</div>
                        {payment.paymentMethod?.isCash && (
                          <span className="text-xs text-green-600">Efectivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de Totales */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pagado:</span>
                <span className={`font-semibold ${sale.totalPaid < sale.total ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(sale.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="text-gray-700 font-semibold">Saldo:</span>
                <span className={`font-bold text-lg ${sale.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(sale.balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsModal;