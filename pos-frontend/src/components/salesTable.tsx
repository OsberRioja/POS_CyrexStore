import React from 'react';
import { Eye, Plus } from 'lucide-react';

interface Sale {
  id: string;
  total: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID';
  createdAt: string;
  seller: { name: string; userCode: number };
  client?: { nombre: string; telefono: string };
}

interface SalesTableProps {
  sales: Sale[];
  onViewSale: (sale: Sale) => void;
  onAddPayment?: (sale: Sale) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ sales, onViewSale, onAddPayment }) => {
  const getPaymentStatusBadge = (status: string) => {
    const badges = {
      PAID: <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Pagado</span>,
      PARTIAL: <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pago Parcial</span>,
      PENDING: <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Pendiente</span>,
      OVERPAID: <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Sobrepagado</span>,
    };
    
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

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

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pagado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Saldo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vendedor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sales.map((sale) => (
            <tr 
              key={sale.id} 
              className={`hover:bg-gray-50 ${
                sale.paymentStatus !== 'PAID' ? 'bg-red-25 border-l-4 border-red-400' : ''
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(sale.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div className="font-medium">{sale.client?.nombre || 'Cliente General'}</div>
                  {sale.client?.telefono && (
                    <div className="text-gray-500 text-xs">{sale.client.telefono}</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(sale.total)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={sale.totalPaid < sale.total ? 'text-orange-600' : 'text-green-600'}>
                  {formatCurrency(sale.totalPaid)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`font-semibold ${sale.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(sale.balance)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getPaymentStatusBadge(sale.paymentStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div className="font-medium">{sale.seller?.name}</div>
                  <div className="text-gray-500 text-xs">#{sale.seller?.userCode}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewSale(sale)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </button>
                  {sale.paymentStatus !== 'PAID' && onAddPayment &&(
                    <button
                      onClick={() => onAddPayment(sale)}
                      className="text-green-600 hover:text-green-900 p-1 rounded"
                      title="Completar pago"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sales?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">No hay ventas registradas</p>
        </div>
      )}
    </div>
  );
};

export default SalesTable;