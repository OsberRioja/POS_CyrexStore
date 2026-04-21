import React, { useEffect, useState } from 'react';
import { Eye, Plus, RefreshCw, Edit, Download } from 'lucide-react';
import { useAuth } from '../context/authContext';
import ReturnModal from './ReturnModal';
import { returnService } from '../services/returnService';
import FormattedPrice from './FormattedPrice';

interface Sale {
  id: string;
  saleNumber?: number;
  total: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID';
  createdAt: string;
  seller: { name: string; userCode: number };
  client?: { nombre: string; telefono: string };
  hasReturn?: boolean;
}

interface SalesTableProps {
  sales: Sale[];
  onViewSale: (sale: Sale) => void;
  onAddPayment?: (sale: Sale) => void;
  onReload?: () => void;
  onEditSale?: (sale: any) => void;
  isReopened?: boolean;
  onDownloadReceipt?: (sale: Sale) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ 
  sales, 
  onViewSale, 
  onAddPayment, 
  onReload,
  onEditSale,
  isReopened,
  onDownloadReceipt
}) => {
  const { user } = useAuth();

  // Estados para el modal de devolución
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<any>(null);
  const [salesWithReturns, setSalesWithReturns] = useState<Set<string>>(new Set());

  // verificar qué ventas tienen devoluciones
  useEffect(() => {
    const checkReturs = async () => {
      const returnsMap = new Set<string>();

      // solo verificar para ventas que no tienen el campo hasReturn como true
      const salesToCheck = sales.filter(sale => sale.hasReturn === undefined);
      for (const sale of salesToCheck) {
        try {
          const returns = await returnService.list({ saleId: sale.id });
          if (returns.data && returns.data.length > 0) {
             const validReturn = returns.data.find((r: any) => 
              r.status !== 'REJECTED'
            );
            if (validReturn) {
              returnsMap.add(sale.id);
            }
          }
        } catch (error) {
          console.error(`Error checking returns for sale ${sale.id}:`, error);
        }
      }
      setSalesWithReturns(returnsMap);
    };
    if (sales && sales.length > 0) {
      checkReturs();
    }
  }, [sales]);

  // Determinar si una venta puede tener devolución
  const canReturnSale = (sale: Sale) => {
    // Si la venta ya tiene el campo hasReturn usarlo
    if (sale.hasReturn === true) return false;

    // si no, verificar en nuestro estado local
    return !salesWithReturns.has(sale.id);
  };

  const handleReturn = (sale: any) => {
    setSelectedSaleForReturn(sale);
    setShowReturnModal(true);
  };

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
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Venta
              </th>
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
                  <div className="font-semibold text-blue-700">
                    #{sale.saleNumber ?? sale.id.slice(0, 8)}
                  </div>
                  {sale.saleNumber && (
                    <div className="text-xs text-gray-500">{sale.id.slice(0, 8)}...</div>
                  )}
                </td>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <FormattedPrice
                    amount={sale.total}
                    fromCurrency="BOB"
                    className="font-semibold text-gray-900"
                  />
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

                    {onDownloadReceipt && (
                      <button
                        onClick={() => onDownloadReceipt(sale)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Descargar comprobante"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    
                    {sale.paymentStatus === 'PARTIAL' && onAddPayment && (
                      <button
                        onClick={() => onAddPayment(sale)}
                        className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!onAddPayment}
                        title="Completar pago"
                      >
                        <Plus size={16} />
                      </button>
                    )}

                    {/* Botón de devolución - solo para ADMIN y SUPERVISOR */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && canReturnSale(sale) && (
                      <button
                        onClick={() => handleReturn(sale)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                        title="Devolución"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    
                    {/* Indicador de que ya tiene devolución */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && !canReturnSale(sale) && (
                      <span 
                        className="text-gray-400 p-1 cursor-not-allowed"
                        title="Esta venta ya tiene una devolución registrada"
                      >
                        <RefreshCw size={16} />
                      </span>
                    )}
                    
                    {/* Botón de edición - SOLO para cajas reabiertas */}
                    {onEditSale && (
                      <button
                        onClick={() => onEditSale(sale)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Editar venta"
                      >
                        <Edit size={16} />
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

      {/* Modal de Devolución */}
      {showReturnModal && selectedSaleForReturn && (
        <ReturnModal
          saleId={selectedSaleForReturn.id}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedSaleForReturn(null);
          }}
          onSuccess={() => {
            setSalesWithReturns(prev => new Set(prev.add(selectedSaleForReturn.id)));
            if (onReload) onReload();
            setShowReturnModal(false);
            setSelectedSaleForReturn(null);
          }}
        />
      )}
    </>
  );
};

export default SalesTable;
