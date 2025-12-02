import React from 'react';
import { Package } from 'lucide-react';

interface Movement {
  id: number;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  notes?: string;
  reason?: string;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
  provider?: {
    name: string;
  };
  sale?: {
    id: string;
    total: number;
    createdAt: string;
    client?: {
      nombre: string;
    };
    seller?: {
      name: string;
      userCode: number;
    };
    paymentStatus?: string;
  };
  user: {
    name: string;
    userCode: number;
  };
}

interface StockMovementsTableProps {
  movements: Movement[];
}

const StockMovementsTable: React.FC<StockMovementsTableProps> = ({ movements }) => {
  // Verificar que movements sea un array
  if (!Array.isArray(movements)) {
    console.error('Movements no es un array:', movements);
    return (
      <div className="text-center py-8 text-red-600">
        Error: Los datos de movimientos no están en el formato correcto
      </div>
    );
  }

  const getMovementLabel = (type: string) => {
    const labels = {
      PURCHASE: 'Compra',
      SALE: 'Venta',
      REPAIR_OUT: 'Reparación',
      DEMO_OUT: 'Demo',
      RETURN_IN: 'Devolución',
      ADJUSTMENT: 'Ajuste'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementBadge = (type: string) => {
    const badges = {
      PURCHASE: 'bg-green-100 text-green-800 border-green-200',
      SALE: 'bg-red-100 text-red-800 border-red-200',
      REPAIR_OUT: 'bg-orange-100 text-orange-800 border-orange-200',
      DEMO_OUT: 'bg-purple-100 text-purple-800 border-purple-200',
      RETURN_IN: 'bg-teal-100 text-teal-800 border-teal-200',
      ADJUSTMENT: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (movements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        <Package size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No hay movimientos registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venta</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Anterior</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Nuevo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {movements.map((movement) => (
            <tr key={movement.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(movement.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getMovementBadge(movement.movementType)}`}>
                  {getMovementLabel(movement.movementType)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                <span className={
                  movement.movementType === 'PURCHASE' || movement.movementType === 'RETURN_IN' || movement.movementType === 'ADJUSTMENT' && movement.quantity > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }>
                  {movement.movementType === 'PURCHASE' || movement.movementType === 'RETURN_IN' || (movement.movementType === 'ADJUSTMENT' && movement.quantity > 0) ? '+' : ''}
                  {movement.quantity}
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                {movement.sale ? (
                  <div className='space-y-1'>
                    <div className='flex items-center gap-1'>
                      <span className='font-mono text-xs bg-gray-100 px-2 py-1 rounded'>
                        {movement.sale.id.substring(0, 8)}...
                      </span>
                      {movement.sale.paymentStatus && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          movement.sale.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : movement.sale.paymentStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.sale.paymentStatus === 'PAID' ? 'Pagado' :
                          movement.sale.paymentStatus === 'PENDING' ? 'Pendiente' : 'Parcial'}
                        </span>
                      )}
                    </div>
                    {movement.sale.client && (
                      <div className="text-xs text-gray-500">
                        Cliente: {movement.sale.client.nombre}
                      </div>
                    )}
                    {movement.sale.seller && (
                      <div className="text-xs text-gray-500">
                        Vendedor: {movement.sale.seller.name} (#{movement.sale.seller.userCode})
                      </div>
                    )}
                    <div className='text-xs font-medium'>
                      Total: Bs. {movement.sale.total?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                {movement.previousStock}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                {movement.newStock}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div>
                  <div className="font-medium">{movement.user?.name || 'Sistema'}</div>
                  {movement.user?.userCode && (
                    <div className="text-xs text-gray-500">#{movement.user.userCode}</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                <div className="truncate" title={movement.notes}>
                  {movement.notes || '-'}
                </div>
                {movement.reason && (
                  <div className="text-xs text-blue-600 mt-1">
                    <strong>Razón:</strong> {movement.reason}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockMovementsTable;