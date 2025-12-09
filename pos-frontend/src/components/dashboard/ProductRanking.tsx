import React from 'react';

interface ProductRankingProps {
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
  }>;
  title?: string;
  maxItems?: number;
}

const ProductRanking: React.FC<ProductRankingProps> = ({ 
  products = [],  // Valor por defecto array vacío
  title = "Productos Más Vendidos",
  maxItems = 5
}) => {
  const displayedProducts = (products || []).slice(0, maxItems);

  // Si no hay productos, mostrar mensaje
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
                <p className="text-sm text-gray-500">{product.quantity || 0} unidades</p>
              </div>
            </div>
            <div className="text-right">
              {/* CORRECCIÓN: Verificar que amount sea un número antes de toFixed */}
              <p className="font-semibold text-gray-800">
                Bs. {typeof product.amount === 'number' ? product.amount.toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductRanking;