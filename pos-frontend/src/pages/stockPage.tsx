import { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Search, 
  Filter, 
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  Wrench,
  MonitorPlay,
  History,
  Building,
  BarChart3
} from 'lucide-react';
import { stockService } from '../services/stockService';
import StockMovementsTable from '../components/StockMovementsTable';
import PurchaseStockModal from '../components/PurchaseStockModal';
import OutboundStockModal from '../components/OutboundStockModal';
import UpdatePricesModal from '../components/UpdatePricesModal';
import ProductHistoryModal from '../components/ProductHistoryModal';
import FormattedPrice from '../components/FormattedPrice';
import ProductPrice from '../services/ProductPrice';
import ActiveRepairsTable from '../components/ActiveRepairsTable';
import ActiveDemosTable from '../components/ActiveDemosTable';
import { productService } from '../services/productService';
import SearchSalesBar from '../components/SearchSalesBar';
import { saleService } from '../services/saleService';
import SaleDetailsModal from '../components/SaleDetailModal';
import AdjustStockModal from '../components/AdjustStockModal';
import ActiveInternalUsesTable from '../components/ActiveInternalUsesTable';
import InternalUseModal from '../components/InternalUseModal';

type ViewType = 'movements' | 'products' | 'active-repairs' | 'active-demos' | 'active-internal-uses';
type MovementTypeFilter = 'ALL' | 'PURCHASE' | 'SALE' | 'REPAIR_OUT' | 'DEMO_OUT' | 'RETURN_IN' | 'ADJUSMENT' | 'INTERNAL_USE_OUT' | 'INTERNAL_USE_RETURN';

export default function StockPage() {
  const [view, setView] = useState<ViewType>('movements');
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<MovementTypeFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeRepairs, setActiveRepairs] = useState<any[]>([]);
  const [activeDemos, setActiveDemos] = useState<any[]>([]);
  const [activeInternalUses, setActiveInternalUses] = useState<any[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showInternalUseModal, setShowInternalUseModal] = useState(false);

  const [searchSaleId, setSearchSaleId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  
  // Modales
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showPricesModal, setShowPricesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [selectedSaleForModal, setSelectedSaleForModal] = useState<any>(null);
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  useEffect(() => {
    if (view === 'active-repairs') {
      loadActiveRepairs();
    } else if (view === 'active-demos') {
      loadActiveDemos();
    } else if (view === 'active-internal-uses') {
      loadActiveInternalUses();
    }
  }, [view]);

  // useEffect para cargar usos internos
  useEffect(() => {
    if (view === 'active-internal-uses') {
      loadActiveInternalUses();
    }
  }, [view]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [movementsRes, productsRes, summaryRes] = await Promise.all([
        stockService.listMovements({ limit: 50 }),
        loadProducts(),
        stockService.getSummary()
      ]);

      setMovements(movementsRes.data?.data || []);
      setProducts(productsRes);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      // Cambiar esta llamada directa por axios a usar productService con onlyActive
      const response = await productService.search({ onlyActive: true });
      return response.data || [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  };

  const loadMovements = async () => {
    try {
      const filters: any = { limit: 50 };
      if (movementTypeFilter !== 'ALL') {
        filters.movementType = movementTypeFilter;
      }

      // Si hay búsqueda activa, usar saleId
      if (searchSaleId) {
        filters.saleId = searchSaleId;
        filters.movementType = 'SALE';
      }
      
      const response = await stockService.listMovements(filters);
      setMovements(response.data?.data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  //cargar reparaciones activas
  const loadActiveRepairs = async () => {
    try {
      const response = await stockService.getActiveRepairs();
      setActiveRepairs(response.data || []);
    } catch (error) {
      console.error('Error loading active repairs:', error);
    }
  };

  //cargar demos activas
  const loadActiveDemos = async () => {
    try {
      const response = await stockService.getActiveDemos();
      setActiveDemos(response.data || []);
    } catch (error) {
      console.error('Error loading active demos:', error);
    }
  };

  const filterProducts = () => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = products.filter((product: any) =>
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  // Función para cargar usos internos
  const loadActiveInternalUses = async () => {
    try {
      const response = await stockService.getActiveInternalUses();
      setActiveInternalUses(response.data || []);
    } catch (error) {
      console.error('Error loading active internal uses:', error);
    }
  };

  const handlePurchase = (product: any) => {
    setSelectedProduct(product);
    setShowPurchaseModal(true);
  };

  const handleRepair = (product: any) => {
    setSelectedProduct(product);
    setShowRepairModal(true);
  };

  const handleDemo = (product: any) => {
    setSelectedProduct(product);
    setShowDemoModal(true);
  };

  const handleUpdatePrices = (product: any) => {
    setSelectedProduct(product);
    setShowPricesModal(true);
  };

  const handleViewHistory = (product: any) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const handleAdjustment = (product: any) => {
    setSelectedProduct(product);
    setShowAdjustmentModal(true);
  };

  const handleInternalUse = (product: any) => {
    setSelectedProduct(product);
    setShowInternalUseModal(true);
  };


  const handleSearchSale = async (saleId: string) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchSaleId(saleId);
    setSelectedSaleForModal(null);

    try {
      // Primero intentamos buscar directamente la venta
      const saleResponse = await saleService.searchById(saleId);

      if (saleResponse.success && saleResponse.data) {
        // Guardamos la venta completa
        setSelectedSaleForModal(saleResponse.data);

        // Si encontramos la venta, buscamos sus movimientos
        const movementsResponse = await stockService.listMovements({ 
          saleId,
          movementType: 'SALE'
        });

        setSearchResults(movementsResponse.data?.data || []);

        // Si no hay movimientos, crear un resultado con la venta
        if (movementsResponse.data?.data?.length === 0) {
          setSearchResults([{ sale: saleResponse.data }]);
        }
      } else {
        throw new Error(saleResponse.message || 'Venta no encontrada');
      }
    } catch (error: any) {
      console.error('Error buscando venta:', error);
      setSearchError(error.message || 'Error al buscar venta');
      setSearchResults(null);

      // También intentamos buscar movimientos directamente
      try {
        const movementsResponse = await stockService.listMovements({ 
          saleId,
          movementType: 'SALE'
        });

        if (movementsResponse.data?.data?.length > 0) {
          setSearchResults(movementsResponse.data.data);
          setSearchError(null);
        }
      } catch (movementsError) {
        // Si ambos fallan, dejamos el error original
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewSaleDetails = async () => {
    if (selectedSaleForModal) {
      setShowSaleDetailsModal(true);
      return;
    }
    if (searchResults && searchResults.length > 0 && searchResults[0]?.sale?.id) {
      setIsSearching(true);
      try {
        const saleId = searchResults[0].sale.id;
        const saleResponse = await saleService.searchById(saleId);
        if (saleResponse.success) {
          setSelectedSaleForModal(saleResponse.data);
          setShowSaleDetailsModal(true);
        }
      } catch (error) {
        console.error('Error obteniendo detalles de venta:', error);
        // Si falla, intentar usar la venta básica que ya tenemos
        if (searchResults[0]?.sale) {
          setSelectedSaleForModal(searchResults[0].sale);
          setShowSaleDetailsModal(true);
        }
      } finally {
        setIsSearching(false);
      }
    }
  };


  // 4. Crear función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchSaleId(null);
    setSearchResults(null);
    setSearchError(null);
    setSelectedSaleForModal(null);
    // Recargar movimientos normales
    if (view === 'movements') {
      loadMovements();
    }
  };

  const handleSuccess = () => {
    loadAll();
  };

  useEffect(() => {
    if (searchSaleId && movementTypeFilter === 'SALE') {
      loadMovements();
    } else if (movementTypeFilter !== 'ALL') {
      loadMovements();
    } else {
      loadAll();
    }
  }, [movementTypeFilter, searchSaleId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1">Control de stock, compras y movimientos</p>
        </div>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-3xl font-bold text-gray-900">{summary.summary.totalProducts}</p>
              </div>
              <Package size={40} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sin Stock</p>
                <p className="text-3xl font-bold text-red-600">{summary.summary.outOfStockCount}</p>
              </div>
              <AlertTriangle size={40} className="text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-3xl font-bold text-orange-600">{summary.summary.lowStockCount}</p>
              </div>
              <TrendingUp size={40} className="text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Inventario</p>
                <FormattedPrice 
                  amount={summary.summary.totalInventoryValue} 
                  fromCurrency="BOB"
                  className="text-2xl font-bold text-green-600"
                />
              </div>
              <DollarSign size={40} className="text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Productos con bajo stock */}
      {summary?.lowStockProducts && summary.lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-orange-600" />
            <h3 className="font-semibold text-orange-800">Productos con Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.lowStockProducts.slice(0, 6).map((product: any) => (
              <div key={product.id} className="bg-white p-3 rounded border border-orange-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
                    {product.stock}
                  </span>
                </div>
                <button
                  onClick={() => handlePurchase(product)}
                  className="mt-2 w-full text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                >
                  Comprar Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegación de vistas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setView('movements')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'movements'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          📊 Movimientos
        </button>
        <button
          onClick={() => setView('products')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'products'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          📦 Productos
        </button>
        <button 
          onClick={() => setView('active-repairs')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'active-repairs' 
              ? 'bg-orange-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          🔧 Reparaciones
        </button>
        <button
          onClick={() => setView('active-demos')} 
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'active-demos' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          🎮 Demos
        </button>
        <button
          onClick={() => setView('active-internal-uses')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            view === 'active-internal-uses'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          🏢 Uso Interno
        </button>
      </div>

      {/* Vista de Movimientos */}
      {view === 'movements' && (
        <div className="space-y-4">
          {/* Filtros existentes */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
            <Filter size={20} className="text-gray-600" />
            <select
              value={movementTypeFilter}
              onChange={(e) => { 
                setMovementTypeFilter(e.target.value as MovementTypeFilter);
                // Si cambiamos el filtro y no es SALE limpiamos la búsqueda
                if (e.target.value !== 'SALE') {
                  handleClearSearch();
                }
              }}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los movimientos</option>
              <option value="PURCHASE">Compras</option>
              <option value="SALE">Ventas</option>
              <option value="REPAIR_OUT">Reparaciones</option>
              <option value="DEMO_OUT">Demos</option>
              <option value="RETURN_IN">Devoluciones</option>
              <option value="ADJUSMENT">Ajustes</option>
              <option value="INTERNAL_USE_OUT">Uso Interno</option>
              <option value="INTERNAL_USE_RETURN">Retorno Uso Interno</option>
            </select>
          </div>
            
          {/* Componente de búsqueda condicional - SOLO para ventas */}
          {view === 'movements' && movementTypeFilter === 'SALE' && (
            <SearchSalesBar
              onSearch={handleSearchSale}
              onClear={handleClearSearch}
              isSearching={isSearching}
              searchResults={searchResults || undefined}
              hasResults={!!searchSaleId}
              onViewDetails={handleViewSaleDetails}
            />
          )}

          {/* Mostrar error de búsqueda si existe */}
          {searchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Error en búsqueda</p>
                  <p className="text-red-600 text-sm">{searchError}</p>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 CONTENEDOR CON SCROLL HORIZONTAL - AQUÍ ESTÁ LA SOLUCIÓN */}
            <StockMovementsTable
              movements={searchResults || movements}
              onViewSale={(sale) => {
                saleService.searchById(sale.id)
                  .then(response => {
                    if (response.success) {
                      setSelectedSaleForModal(response.data);
                      setShowSaleDetailsModal(true);
                    }
                  })
                  .catch(err => {
                    console.error('Error obteniendo detalles de venta:', err);
                    setSelectedSaleForModal(sale);
                    setShowSaleDetailsModal(true);
                  });
              }}
            />
        </div>
      )}

      {view === 'active-repairs' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Wrench size={20} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-orange-800">Reparaciones Activas</h2>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Productos enviados a reparación que aún no han retornado al stock
            </p>
          </div>
          <ActiveRepairsTable 
            repairs={activeRepairs} 
            onComplete={() => {
              loadActiveRepairs();
              loadAll(); // Recargar datos generales
            }}
          />
        </div>
      )}

      {view === 'active-demos' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MonitorPlay size={20} className="text-purple-600" />
              <h2 className="text-lg font-semibold text-purple-800">Demos Activas</h2>
            </div>
            <p className="text-sm text-purple-700 mt-1">
              Productos enviados a demo que aún no han retornado al stock
            </p>
          </div>
          <ActiveDemosTable 
            demos={activeDemos} 
            onComplete={() => {
              loadActiveDemos();
              loadAll(); // Recargar datos generales
            }}
          />
        </div>
      )}
      {view === 'active-internal-uses' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building size={20} className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-indigo-800">Usos Internos Activos</h2>
            </div>
            <p className="text-sm text-indigo-700 mt-1">
              Productos utilizados internamente (eventos, taller, etc.)
            </p>
          </div>
          <ActiveInternalUsesTable 
            internalUses={activeInternalUses} 
            onReturn={() => {
              loadActiveInternalUses();
              loadAll();
            }}
          />
        </div>
      )}

      {/* Vista de Productos */}
      {view === 'products' && (
        <div className="space-y-4">
          {/* Buscador */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Margen</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const margin = product.costPrice ? 
                    ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(0) : 'N/A';
                  const stockStatus = product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : 'ok';

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          {product.category && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {product.category}
                            </span>
                          )}
                          {/* ← Badge de moneda */}
                          {product.priceCurrency && product.priceCurrency !== 'BOB' && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              {product.priceCurrency === 'USD' ? '🇺🇸 Dólares' : '🇨🇳 Yuanes'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          stockStatus === 'out' ? 'bg-red-100 text-red-800' :
                          stockStatus === 'low' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      
                      {/* ← CORREGIDO: Columna de Costo */}
                      <td className="px-6 py-4 text-right">
                        {product.costPrice ? (
                          <ProductPrice
                            product={{
                              salePrice: product.costPrice, // Usamos salePrice para mostrar costo
                              costPrice: product.costPrice,
                              priceCurrency: product.priceCurrency || 'BOB'
                            }}
                            showCost={false}
                            showOriginal={true}
                            className="text-sm text-gray-600"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      
                      {/* ← CORREGIDO: Columna de Precio Venta */}
                      <td className="px-6 py-4 text-right">
                        <ProductPrice
                          product={{
                            salePrice: product.salePrice,
                            costPrice: product.costPrice,
                            priceCurrency: product.priceCurrency || 'BOB'
                          }}
                          showCost={false}
                          showOriginal={true}
                          className="text-sm font-semibold text-gray-900"
                        />
                      </td>
                        
                      <td className="px-6 py-4 text-center">
                        {product.costPrice ? (
                          <span className={`font-semibold ${
                            parseFloat(margin) > 30 ? 'text-green-600' : 
                            parseFloat(margin) > 15 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {margin}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePurchase(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Comprar stock"
                          >
                            <ShoppingCart size={18} />
                          </button>
                          <button
                            onClick={() => handleRepair(product)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Enviar a reparación"
                          >
                            <Wrench size={18} />
                          </button>
                          <button
                            onClick={() => handleDemo(product)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Enviar a demo"
                          >
                            <MonitorPlay size={18} />
                          </button>
                          <button
                            onClick={() => handleUpdatePrices(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Actualizar precios"
                          >
                            <DollarSign size={18} />
                          </button>
                          <button
                            onClick={() => handleAdjustment(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ajustar stock"
                          >
                            <BarChart3 size={18} />
                          </button>
                          <button
                            onClick={() => handleInternalUse(product)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Registrar uso interno"
                          >
                            <Building size={18} />
                          </button>
                          <button
                            onClick={() => handleViewHistory(product)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="Ver historial"
                          >
                            <History size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modales */}
      {showPurchaseModal && selectedProduct && (
        <PurchaseStockModal
          product={selectedProduct}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showRepairModal && selectedProduct && (
        <OutboundStockModal
          product={selectedProduct}
          type="repair"
          onClose={() => {
            setShowRepairModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showDemoModal && selectedProduct && (
        <OutboundStockModal
          product={selectedProduct}
          type="demo"
          onClose={() => {
            setShowDemoModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showPricesModal && selectedProduct && (
        <UpdatePricesModal
          product={selectedProduct}
          onClose={() => {
            setShowPricesModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showHistoryModal && selectedProduct && (
        <ProductHistoryModal
          product={selectedProduct}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showSaleDetailsModal && selectedSaleForModal && (
        <SaleDetailsModal
          sale={selectedSaleForModal}
          onClose={() => {
            setShowSaleDetailsModal(false);
            // No limpiamos selectedSaleForModal para mantener los datos si se vuelve a abrir
          }}
        />
      )}
      {showAdjustmentModal && selectedProduct && (
        <AdjustStockModal
          product={selectedProduct}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showInternalUseModal && selectedProduct && (
        <InternalUseModal
          product={selectedProduct}
          onClose={() => {
            setShowInternalUseModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}