import React, { useState } from 'react';
import { Search, X, AlertCircle, ExternalLink } from 'lucide-react';

interface SearchSalesBarProps {
  onSearch: (saleId: string) => Promise<void>;
  onClear: () => void;
  isSearching: boolean;
  searchResults?: any[];
  hasResults: boolean;
  onViewDetails?: () => void;
}

const SearchSalesBar: React.FC<SearchSalesBarProps> = ({
  onSearch,
  onClear,
  isSearching,
  searchResults,
  hasResults,
  onViewDetails
}) => {
  const [saleId, setSaleId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateSaleId = (id: string): boolean => {
    // Validar formato UUID o ID numérico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const numericRegex = /^\d+$/;
    
    return uuidRegex.test(id) || numericRegex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!saleId.trim()) {
      setError('Por favor ingrese un ID de venta');
      return;
    }

    if (!validateSaleId(saleId.trim())) {
      setError('Formato de ID inválido. Use UUID o número.');
      return;
    }

    try {
      await onSearch(saleId.trim());
    } catch (err: any) {
      setError(err.message || 'Error al buscar venta');
    }
  };

  const handleClear = () => {
    setSaleId('');
    setError(null);
    onClear();
  };

  const formatSaleId = (id: string): string => {
    if (id.length > 20) {
      return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
    }
    return id;
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">Buscar Venta por ID</h3>
          </div>
          {hasResults && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X size={16} />
              Limpiar búsqueda
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
                placeholder="Ingrese ID de venta (UUID o número)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching}
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Ejemplo de UUID: <code className="bg-gray-100 px-1 rounded">550e8400-e29b-41d4-a716-446655440000</code>
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSearching || !saleId.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Buscar
                  </>
                )}
              </button>
              
              {hasResults && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <X size={16} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Resultados rápidos */}
        {hasResults && searchResults && searchResults.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  ✅ Encontrada venta: {formatSaleId(searchResults[0]?.sale?.id || saleId)}
                </p>
                <p className="text-xs text-blue-600">
                  Mostrando {searchResults.length} movimiento(s) asociado(s)
                </p>
              </div>
              {searchResults[0]?.sale && (
                <button
                    onClick={() => onViewDetails && onViewDetails()}
                    className='text-sm text-blue-700 hover:text-blue-900 flex items-center gap-1'
                >
                    Ver Detalles
                    <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {hasResults && searchResults && searchResults.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Venta encontrada pero sin movimientos de stock
                </p>
                <p className="text-xs text-yellow-600">
                  Esta venta existe pero no tiene movimientos registrados en el inventario
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modo búsqueda activa */}
      {hasResults && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Modo búsqueda activo
              </span>
            </div>
            <button
              onClick={handleClear}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mostrar todas las ventas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSalesBar;