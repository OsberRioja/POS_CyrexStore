import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";
import { dashboardService } from "../services/dashboardService";
import MetricCard from "../components/dashboard/MetricCard";
import ProductRanking from "../components/dashboard/ProductRanking";
import PeriodFilter from "../components/dashboard/PeriodFilter";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { branches, currentBranchId } = useBranch();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('day');
  const [refreshing, setRefreshing] = useState(false);

  // Obtener nombre de la sucursal actual
  const currentBranchName = branches.find(b => b.id === currentBranchId)?.name;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      if (!currentBranchId) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getBranchDashboard(currentBranchId, period);
        setDashboardData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error loading dashboard:", err);
        setError(err.message || "Error al cargar el dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    if (currentBranchId) {
      loadDashboard();
    }
  }, [currentBranchId, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    // El useEffect se ejecutará de nuevo porque refreshing cambió
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para obtener el título del período
  const getPeriodTitle = () => {
    const titles: { [key: string]: string } = {
      day: 'Hoy',
      week: 'Esta semana',
      month: 'Este mes',
      year: 'Este año',
      all: 'Histórico',
      historical: 'Histórico'
    };
    return titles[period] || 'Hoy';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error al cargar el dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Dashboard - {currentBranchName || "Sucursal"}
            </h1>
            <p className="text-gray-600">
              {formatDate(currentTime)} • {formatTime(currentTime)}
              {dashboardData?.period && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Período: {getPeriodTitle()}
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <div className="text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Código: #{user?.userCode}</span>
                <span>•</span>
                <span className="capitalize">
                  {user?.role === "ADMIN" ? "Administrador" : 
                   user?.role === "SUPERVISOR" ? "Supervisor" : "Vendedor"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Filtro de período */}
        <PeriodFilter period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={`Ventas ${getPeriodTitle()}`}
          value={dashboardData?.salesToday?.count || 0}
          subtitle={`Bs. ${(dashboardData?.salesToday?.amount || 0).toFixed(2)}`}
          icon={<ShoppingBag className="h-6 w-6" />}
          color="blue"
        />
      
        <MetricCard
          title={`Ganancias ${getPeriodTitle()}`}
          value={`Bs. ${(dashboardData?.earningsToday?.grossEarnings || 0).toFixed(2)}`}
          subtitle={`${dashboardData?.salesToday?.count || 0} ventas`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
      
        <MetricCard
          title="Ticket Promedio"
          value={`Bs. ${(dashboardData?.averageTicket || 0).toFixed(2)}`}
          subtitle="Por venta"
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      
        <MetricCard
          title="Estado Caja"
          value={dashboardData?.cashBoxStatus?.isOpen ? "Abierta" : "Cerrada"}
          subtitle={dashboardData?.cashBoxStatus?.isOpen 
            ? `Bs. ${(dashboardData?.cashBoxStatus?.currentAmount || 0).toFixed(2)}`
            : "Abrir caja para ventas"}
          icon={<AlertCircle className="h-6 w-6" />}
          color={dashboardData?.cashBoxStatus?.isOpen ? "green" : "red"}
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ProductRanking
            products={dashboardData?.topProducts || []}
            title={`Productos Más Vendidos ${getPeriodTitle()}`}
            showStock={false} // ← Cambiado a false para no mostrar stock
          />
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Vendedores Destacados {getPeriodTitle()}
          </h3>
          <div className="space-y-4">
            {(dashboardData?.topSellers || []).map((seller: any, index: number) => (
              <div key={seller.userId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    <span className="text-sm font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{seller.userName}</p>
                    <p className="text-sm text-gray-500">{seller.salesCount} ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">Bs. {seller.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tercera fila: Alertas y resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas de stock bajo */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Alertas de Stock</h3>
            {dashboardData?.lowStockProducts.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {dashboardData.lowStockProducts.length} alertas
              </span>
            )}
          </div>
          {dashboardData?.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.lowStockProducts.map((product: any) => (
                <div key={product.productId} className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <div>
                    <p className="font-medium text-gray-800">{product.productName}</p>
                    <p className="text-sm text-gray-600">Stock actual: {product.currentStock} unidades</p>
                  </div>
                  <div className="text-red-600 font-semibold">
                    <Package className="h-5 w-5 inline mr-1" />
                    Stock bajo
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay productos con stock bajo</p>
            </div>
          )}
        </div>

        {/* Resumen de la sucursal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Sucursal</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Clientes registrados</span>
              </div>
              <span className="font-semibold">{dashboardData?.summary.totalClients || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Productos activos</span>
              </div>
              <span className="font-semibold">{dashboardData?.summary.totalProducts || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Usuarios activos</span>
              </div>
              <span className="font-semibold">{dashboardData?.summary.totalUsers || 0}</span>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Última actualización:</span>
                <span className="text-sm text-gray-500">{formatTime(new Date())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}