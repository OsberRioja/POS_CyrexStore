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
  serialNumbers?: string[];
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
  onViewSale?: (sale: any) => void;
}

const StockMovementsTable: React.FC<StockMovementsTableProps> = ({ movements, onViewSale }) => {
  if (!Array.isArray(movements)) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: Los datos de movimientos no están en el formato correcto
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        <Package size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No hay movimientos registrados</p>
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
      ADJUSTMENT: 'Ajuste',
      INTERNAL_USE_OUT: 'Uso Interno',
      INTERNAL_USE_RETURN: 'Retorno Uso Interno',
      TRANSFER_OUT: 'Transferencia Salida',
      TRANSFER_IN: 'Transferencia Entrada',
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
      ADJUSTMENT: 'bg-blue-100 text-blue-800 border-blue-200',
      INTERNAL_USE_OUT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      INTERNAL_USE_RETURN: 'bg-pink-100 text-pink-800 border-pink-200',
      TRANSFER_OUT: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      TRANSFER_IN: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getQuantityColor = (movement: Movement) => {
    const { movementType, quantity } = movement;
    
    if (movementType === 'PURCHASE' || movementType === 'RETURN_IN' ||
        movementType === 'INTERNAL_USE_RETURN' || movementType === 'REPAIR_RETURN' || 
        movementType === 'DEMO_RETURN' || movementType === 'TRANSFER_IN') {
      return 'text-green-600';
    }
    
    if (movementType === 'SALE' || movementType === 'REPAIR_OUT' || movementType === 'DEMO_OUT' ||
        movementType === 'INTERNAL_USE_OUT' || movementType === 'TRANSFER_OUT') {
      return 'text-red-600';
    }
    
    if (movementType === 'ADJUSTMENT') {
      return quantity > 0 ? 'text-green-600' : 'text-red-600';
    }
    
    return 'text-gray-600';
  };

  const getQuantitySign = (movement: Movement) => {
    const { movementType, quantity } = movement;
    
    if (movementType === 'PURCHASE' || movementType === 'RETURN_IN' || movementType === 'TRANSFER_IN') {
      return '+';
    }
    
    if (movementType === 'SALE' || movementType === 'REPAIR_OUT' || movementType === 'DEMO_OUT' || movementType === 'TRANSFER_OUT') {
      return '';
    }
    
    if (movementType === 'ADJUSTMENT') {
      return quantity > 0 ? '+' : '';
    }
    
    return '';
  };

  return (
    <div className="w-full border border-gray-300 rounded-lg bg-white shadow">
      <div className='overflow-x-auto'>
        <div className='inline-block min-w-full align-middle'>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Ant.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Nuevo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venta/Prov.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(movement.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getMovementBadge(movement.movementType)}`}>
                      {getMovementLabel(movement.movementType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="max-w-[180px]">
                      <div className="font-medium text-gray-900 truncate" title={movement.product?.name || 'Sin nombre'}>
                        {movement.product?.name || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-gray-500">
                        SKU: {movement.product?.sku || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${getQuantityColor(movement)}`}>
                      {getQuantitySign(movement)}
                      {movement.quantity}
                    </span>
                    {movement.unitCost !== undefined && movement.unitCost !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        Costo: Bs. {movement.unitCost.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                    {movement.previousStock}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {movement.newStock}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {movement.sale ? (
                      <div className="space-y-1 min-w-[200px]">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {movement.sale.id?.substring(0, 8) || 'ID'}
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
                          <div className="text-xs text-gray-500 truncate" title={movement.sale.client.nombre}>
                            Cliente: {movement.sale.client.nombre}
                          </div>
                        )}
                        {onViewSale && movement.sale.id && (
                          <button
                            onClick={() => onViewSale(movement.sale)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                          >
                            Ver detalles
                          </button>
                        )}
                      </div>
                    ) : movement.provider ? (
                      <div>
                        <div className="font-medium text-gray-900">{movement.provider.name}</div>
                        <div className="text-xs text-gray-500">Proveedor</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div>
                      <div className="font-medium">{movement.user?.name || 'Sistema'}</div>
                      {movement.user?.userCode && (
                        <div className="text-xs text-gray-500">#{movement.user.userCode}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                    <div className="space-y-1">
                      {movement.notes && (
                        <div className="truncate" title={movement.notes}>
                          <span className="font-medium">Nota:</span> {movement.notes}
                        </div>
                      )}
                      {movement.reason && (
                        <div className="truncate text-blue-600" title={movement.reason}>
                          <span className="font-medium">Razón:</span> {movement.reason}
                        </div>
                      )}
                      {Array.isArray(movement.serialNumbers) && movement.serialNumbers.length > 0 && (
                        <div className="text-xs text-purple-700" title={movement.serialNumbers.join(', ')}>
                          <span className="font-medium">Series:</span> {movement.serialNumbers.join(', ')}
                        </div>
                      )}
                      {!movement.notes && !movement.reason && (!movement.serialNumbers || movement.serialNumbers.length === 0) && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockMovementsTable;
