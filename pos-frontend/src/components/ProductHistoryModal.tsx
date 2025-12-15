import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Image as ImageIcon } from 'lucide-react';
import { stockService } from '../services/stockService';
import StockMovementsTable from './StockMovementsTable';
import ProductPrice from '../services/ProductPrice';

interface ProductHistoryModalProps {
  product: any;
  onClose: () => void;
}

const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({ product, onClose }) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'movements' | 'prices'>('movements');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [product.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔄 Cargando historial para producto: ${product.id}`);
      
      const [movementsRes, pricesRes] = await Promise.all([
        stockService.getProductHistory(product.id),
        stockService.getPriceHistory(product.id)
      ]);

      console.log('📊 Respuesta movimientos:', movementsRes);
      console.log('💰 Respuesta precios:', pricesRes);

      // Manejar diferentes formatos de respuesta
      const movementsData = movementsRes.data?.data || movementsRes.data || [];
      const pricesData = pricesRes.data?.data || pricesRes.data || [];

      console.log(`📦 Movimientos a mostrar: ${movementsData.length}`);
      console.log(`💵 Precios a mostrar: ${pricesData.length}`);

      setMovements(movementsData);
      setPriceHistory(pricesData);
    } catch (error) {
      console.error('❌ Error loading history:', error);
      setError('Error al cargar el historial del producto');
    } finally {
      setLoading(false);
    }
  };

  // NUEVA función para formatear moneda según el tipo
  const formatCurrency = (amount: number, currency: string = 'BOB') => {
    if (currency === 'USD') {
      return `$us ${amount.toFixed(2)}`;
    } else if (currency === 'CNY') {
      return `¥ ${amount.toFixed(2)}`;
    } else {
      return `Bs. ${amount.toFixed(2)}`;
    }
  };

  // Función para obtener el símbolo de moneda
  const getCurrencySymbol = (currency: string = 'BOB') => {
    const symbols: {[key: string]: string} = {
      'BOB': 'Bs.',
      'USD': '$us',
      'CNY': '¥'
    };
    return symbols[currency] || 'Bs.';
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

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex items-start gap-4 flex-1">
            {/* Sección de imagen del producto */}
            <div className="flex-shrink-0">
              {product.imageUrl && !imageError ? (
                <div className="relative group">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                    onError={handleImageError}
                  />
                  {/* Tooltip para ver imagen ampliada */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => window.open(product.imageUrl, '_blank')}
                      className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg transform scale-0 group-hover:scale-100 transition-transform"
                      title="Ver imagen completa"
                    >
                      <ImageIcon size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={32} />
                  <span className="text-xs mt-1 text-center px-1">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">Historial del Producto</h2>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-semibold text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">SKU:</span> {product.sku}
                </p>
                {product.category && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Categoría:</span> {product.category}
                  </p>
                )}
                {product.brand && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Marca:</span> {product.brand}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Precio de venta:</span>{' '}
                  <ProductPrice
                    product={{
                      salePrice: product.salePrice,
                      costPrice: product.costPrice,
                      priceCurrency: product.priceCurrency || 'BOB'
                    }}
                    showCost={false}
                    showOriginal={true}
                  />
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Precio de costo:</span>{' '}
                  <ProductPrice
                    product={{
                      salePrice: product.costPrice, // Usamos salePrice para mostrar costo
                      costPrice: product.costPrice,
                      priceCurrency: product.priceCurrency || 'BOB'
                    }}
                    showCost={false}
                    showOriginal={true}
                  />
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Stock actual:</span> 
                  <span className={`ml-1 font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock} unidades
                  </span>
                </p>
                {/* Mostrar moneda del producto */}
                {product.priceCurrency && product.priceCurrency !== 'BOB' && (
                  <p className="text-sm text-blue-600 font-medium">
                    <span className="font-bold">Moneda:</span> {getCurrencySymbol(product.priceCurrency)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón cerrar */}
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'movements'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            📊 Movimientos de Stock ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'prices'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            💰 Historial de Precios ({priceHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando historial...</p>
            </div>
          ) : activeTab === 'movements' ? (
            <div className="bg-white rounded-lg shadow-sm border">
              <StockMovementsTable movements={movements} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sección de Precio Actual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Precio Actual</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-blue-600">Precio de Costo:</span>
                    <div className="text-xl font-bold text-blue-800">
                      {formatCurrency(product.costPrice, product.priceCurrency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600">Precio de Venta:</span>
                    <div className="text-xl font-bold text-blue-800">
                      {formatCurrency(product.salePrice, product.priceCurrency)}
                    </div>
                  </div>
                </div>
                {/* Indicador de moneda */}
                {product.priceCurrency && product.priceCurrency !== 'BOB' && (
                  <p className="text-xs text-blue-600 mt-2">
                    Precios en {product.priceCurrency === 'USD' ? 'Dólares Estadounidenses' : 'Yuanes Chinos'}
                  </p>
                )}
              </div>

              {/* Historial de Cambios de Precio */}
              {priceHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm border">
                  <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">No hay cambios de precio registrados</p>
                  <p className="text-sm text-gray-500 mt-2">Los cambios de precio aparecerán aquí cuando se actualicen</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Historial de Cambios de Precio</h3>
                    {product.priceCurrency && product.priceCurrency !== 'BOB' && (
                      <p className="text-sm text-gray-600 mt-1">
                        Todos los precios en {getCurrencySymbol(product.priceCurrency)}
                      </p>
                    )}
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Anterior</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Nuevo</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {priceHistory.map((history) => {
                        const difference = history.newPrice - history.oldPrice;
                        // Evitar división por cero
                        const percentChange = history.oldPrice > 0 
                          ? ((difference / history.oldPrice) * 100).toFixed(2)
                          : (difference > 0 ? '100.00' : '0.00');
                        const isIncrease = difference > 0;

                        return (
                          <tr key={history.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(history.changedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                history.priceType === 'cost'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-green-100 text-green-800 border border-green-200'
                              }`}>
                                {history.priceType === 'cost' ? 'Costo' : 'Venta'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 font-medium">
                              {formatCurrency(history.oldPrice, product.priceCurrency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {difference !== 0 ? (
                                isIncrease ? (
                                  <TrendingUp size={18} className="text-green-600 mx-auto" />
                                ) : (
                                  <TrendingDown size={18} className="text-red-600 mx-auto" />
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                              {formatCurrency(history.newPrice, product.priceCurrency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {difference !== 0 ? (
                                <span className={`font-semibold text-sm ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                  {isIncrease ? '+' : ''}{percentChange}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div>
                                <div className="text-gray-900 font-medium">{history.user?.name || 'Sistema'}</div>
                                <div className="text-xs text-gray-500">#{history.user?.userCode || 'N/A'}</div>
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
        <div className="flex justify-end p-4 border-t bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductHistoryModal;