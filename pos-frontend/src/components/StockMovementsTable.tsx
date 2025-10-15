import React from 'react';
import { Package, ShoppingCart, Wrench, MonitorPlay, RotateCcw } from 'lucide-react';

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
  };
  user: {
    name: string;
    userCode: number;
  };
}

interface StockMovementsTableProps {
  movements: Movement[];
  onViewDetails?: (movement: Movement) => void;
}

const StockMovementsTable: React.FC<StockMovementsTableProps> = ({ movements, onViewDetails }) => {
  const getMovementIcon = (type: string) => {
    const icons = {
      PURCHASE: <ShoppingCart size={18} className="text-green-600" />,
      SALE: <Package size={18} className="text-blue-600" />,
      REPAIR_OUT: <Wrench size={18} className="text-orange-600" />,
      DEMO_OUT: <MonitorPlay size={18} className="text-purple-600" />,
      RETURN_IN: <RotateCcw size={18} className="text-teal-600" />,
    };
    return icons[type as keyof typeof icons] || <Package size={18} />;
  };

  const getMovementLabel = (type: string) => {
    const labels = {
      PURCHASE: 'Compra',
      SALE: 'Venta',
      REPAIR_OUT: 'Reparación',
      DEMO_OUT: 'Demo',
      RETURN_IN: 'Devolución',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementBadge = (type: string) => {
    const badges = {
      PURCHASE: 'bg-green-100 text-green-800',
      SALE: 'bg-blue-100 text-blue-800',
      REPAIR_OUT: 'bg-orange-100 text-orange-800',
      DEMO_OUT: 'bg-purple-100 text-purple-800',
      RETURN_IN: 'bg-teal-100 text-teal-800',
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Anterior</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Nuevo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getMovementIcon(movement.movementType)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementBadge(movement.movementType)}`}>
                      {getMovementLabel(movement.movementType)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{movement.product.name}</div>
                    <div className="text-xs text-gray-500">SKU: {movement.product.sku}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-gray-700">
                  {movement.previousStock}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-semibold text-gray-900">
                    {movement.newStock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {movement.movementType === 'PURCHASE' && movement.provider && (
                      <div>
                        <span className="text-gray-600">Proveedor:</span> {movement.provider.name}
                        {movement.unitCost && (
                          <div className="text-xs text-gray-500">
                            Costo: {formatCurrency(movement.unitCost)}
                          </div>
                        )}
                      </div>
                    )}
                    {(movement.movementType === 'REPAIR_OUT' || movement.movementType === 'DEMO_OUT') && movement.reason && (
                      <div className="text-gray-600 text-xs">{movement.reason}</div>
                    )}
                    {movement.movementType === 'RETURN_IN' && movement.sale && (
                      <div className="text-xs text-gray-600">
                        Venta: {movement.sale.id.substring(0, 8)}...
                      </div>
                    )}
                    {movement.notes && (
                      <div className="text-xs text-gray-500 italic mt-1">
                        {movement.notes}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>
                    <div className="text-gray-900">{movement.user.name}</div>
                    <div className="text-xs text-gray-500">#{movement.user.userCode}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(movement.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovementsTable;