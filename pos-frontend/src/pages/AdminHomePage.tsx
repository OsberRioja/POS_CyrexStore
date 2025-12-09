import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";
import BranchCard from "../components/BranchCard";
import BranchFormModal from "../components/BranchFormModal";
import { dashboardService } from "../services/dashboardService";
import MetricCard from "../components/dashboard/MetricCard";
import BranchRanking from "../components/dashboard/BranchRanking";
import ProductRanking from "../components/dashboard/ProductRanking";
import { Building2, Users, DollarSign, AlertTriangle } from "lucide-react";

export default function AdminHomePage() {
  const { user } = useAuth();
  const { 
    activeBranches, 
    loading: branchesLoading, 
    error: branchesError, 
    reloadBranches,
    enterBranch 
  } = useBranch();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [justCreatedBranch, setJustCreatedBranch] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // NUEVO: Efecto para cargar dashboard general
  useEffect(() => {
    async function loadGeneralDashboard() {
      try {
        setLoadingDashboard(true);
        const data = await dashboardService.getGeneralDashboard();
        setDashboardData(data);
        setDashboardError(null);
      } catch (err: any) {
        console.error("Error loading general dashboard:", err);
        setDashboardError(err.message || "Error al cargar el dashboard general");
      } finally {
        setLoadingDashboard(false);
      }
    }

    loadGeneralDashboard();
  }, []);

  // Efecto para ingresar automáticamente a la sucursal recién creada
  useEffect(() => {
    if (justCreatedBranch) {
      console.log('🔄 Ingresando automáticamente a sucursal creada:', justCreatedBranch);
      enterBranch(justCreatedBranch.id);
      setJustCreatedBranch(null);
    }
  }, [justCreatedBranch, enterBranch]);

  const handleCreateSuccess = (newBranch: any) => {
    console.log('✅ Sucursal creada exitosamente:', newBranch);
    setShowCreateModal(false);
    setJustCreatedBranch(newBranch);
    reloadBranches();
  };

  const handleSelectBranch = (branchId: number) => {
    console.log('🎯 Seleccionando sucursal:', branchId);
    enterBranch(branchId);
  };

  const isLoading = branchesLoading || loadingDashboard;
  const error = branchesError || dashboardError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Cargando información...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error al cargar</h3>
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
    <div className="space-y-8">
      {/* Dashboard General */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard General</h1>
            <p className="text-gray-600">Resumen de todas las sucursales</p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Admin:</span> {user?.name}
          </div>
        </div>

        {/* Métricas globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Sucursales Activas"
            value={dashboardData?.globalSummary.activeBranches || 0}
            subtitle={`de ${dashboardData?.globalSummary.totalBranches || 0}`}
            icon={<Building2 className="h-6 w-6" />}
            color="blue"
          />
          
          <MetricCard
            title="Ventas Hoy"
            value={dashboardData?.globalSummary.totalSalesToday || 0}
            subtitle={`Bs. ${(dashboardData?.globalSummary.totalAmountToday || 0).toFixed(2)}`}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          
          <MetricCard
            title="Usuarios Activos"
            value={dashboardData?.globalSummary.activeUsersToday || 0}
            subtitle="Hoy"
            icon={<Users className="h-6 w-6" />}
            color="purple"
          />
          
          <MetricCard
            title="Sucursales con Alertas"
            value={dashboardData?.branchesWithAlerts?.length || 0}
            subtitle="Requieren atención"
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
        </div>

        {/* Ranking y productos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BranchRanking
            branches={dashboardData?.branchRanking || []}
            title="Ranking de Sucursales (Hoy)"
          />
          
          <ProductRanking
            products={dashboardData?.globalTopProducts || []}
            title="Productos Más Vendidos (Global)"
            maxItems={5}
          />
        </div>

        {/* Sucursales con alertas */}
        {dashboardData?.branchesWithAlerts?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sucursales que Requieren Atención</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.branchesWithAlerts.map((branch: any) => (
                <div key={branch.branchId} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-red-800">{branch.branchName}</h4>
                    <button
                      onClick={() => handleSelectBranch(branch.branchId)}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                    >
                      Ingresar
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {branch.alerts.map((alert: string, index: number) => (
                      <li key={index} className="text-sm text-red-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2" />
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gestión de Sucursales */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestión de Sucursales</h2>
            <p className="text-gray-600">Selecciona una sucursal para gestionar</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <span>+</span>
            Nueva Sucursal
          </button>
        </div>

        {/* Grid de Sucursales */}
        {activeBranches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBranches.map((branch) => (
              <BranchCard 
                key={branch.id} 
                branch={branch} 
                onSelect={() => handleSelectBranch(branch.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay sucursales activas
            </h3>
            <p className="text-gray-500 mb-6">
              Comienza creando la primera sucursal del sistema.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Crear Primera Sucursal
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear sucursal */}
      {showCreateModal && (
        <BranchFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}