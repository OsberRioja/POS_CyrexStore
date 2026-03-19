import React from 'react';
import DashboardMoney from './DashboardMoney';

interface ProductRankingProps {
  products: Array<{
    productId: string;
    productName: string;
    quantity: number; // Cantidad vendida
    amount: number;
    currentStock?: number; // Stock actual (opcional)
  }>;
  title?: string;
  maxItems?: number;
  showStock?: boolean; // Nueva prop para mostrar stock
}

const ProductRanking: React.FC<ProductRankingProps> = ({ 
  products = [],
  title = "Productos Más Vendidos",
  maxItems = 5,
  showStock = false // Por defecto no mostrar stock
}) => {
  const displayedProducts = (products || []).slice(0, maxItems);

  if (displayedProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {displayedProducts.map((product, index) => (
          <div key={product.productId || index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{product.productName || "Producto sin nombre"}</p>
                {/* Mostrar cantidad vendida en lugar de stock */}
                <p className="text-sm text-gray-500">
                  {product.quantity || 0} unidades vendidas
                  {showStock && product.currentStock !== undefined && (
                    <span className="ml-2 text-gray-400">
                      • Stock: {product.currentStock}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <DashboardMoney
                amount={typeof product.amount === 'number' ? product.amount : 0}
                className="font-semibold text-gray-800"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductRanking;