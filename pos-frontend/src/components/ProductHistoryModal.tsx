import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { stockService } from '../services/stockService';
import StockMovementsTable from './StockMovementsTable';

interface ProductHistoryModalProps {
  product: any;
  onClose: () => void;
}

const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({ product, onClose }) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'movements' | 'prices'>('movements');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [product.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsRes, pricesRes] = await Promise.all([
        stockService.getProductHistory(product.id),
        stockService.getPriceHistory(product.id)
      ]);
      setMovements(movementsRes.data || []);
      setPriceHistory(pricesRes.data || []);
    } catch (error) {
      console.error('Error loading history:', error);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Historial del Producto</h2>
            <p className="text-sm text-gray-600">{product.name} - SKU: {product.sku}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'movements'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Movimientos de Stock ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'prices'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Historial de Precios ({priceHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando historial...</p>
            </div>
          ) : activeTab === 'movements' ? (
            <StockMovementsTable movements={movements} />
          ) : (
            <div className="space-y-4">
              {priceHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No hay cambios de precio registrados</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Anterior</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Nuevo</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cambio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {priceHistory.map((history) => {
                        const difference = history.newPrice - history.oldPrice;
                        const percentChange = ((difference / history.oldPrice) * 100).toFixed(2);
                        const isIncrease = difference > 0;

                        return (
                          <tr key={history.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(history.changedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                history.priceType === 'cost'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {history.priceType === 'cost' ? 'Costo' : 'Venta'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                              {formatCurrency(history.oldPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {isIncrease ? (
                                <TrendingUp size={18} className="text-green-600 mx-auto" />
                              ) : (
                                <TrendingDown size={18} className="text-red-600 mx-auto" />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                              {formatCurrency(history.newPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                {isIncrease ? '+' : ''}{percentChange}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div>
                                <div className="text-gray-900">{history.user.name}</div>
                                <div className="text-xs text-gray-500">#{history.user.userCode}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {history.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductHistoryModal;