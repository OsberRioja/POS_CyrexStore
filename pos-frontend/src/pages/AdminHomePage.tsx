// En src/pages/AdminHomePage.tsx - ACTUALIZAR
import { useState } from "react";
import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";
import BranchCard from "../components/BranchCard";
import BranchFormModal from "../components/BranchFormModal";

export default function AdminHomePage() {
  const { user } = useAuth();
  const { 
    activeBranches, 
    loading, 
    error, 
    reloadBranches,
    enterBranch 
  } = useBranch();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Manejar recarga después de crear sucursal
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // No necesitamos recargar manualmente porque el hook useBranch ya lo hace
  };

  // Función para manejar selección de sucursal
  const handleSelectBranch = (branchId: number) => {
    enterBranch(branchId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Cargando sucursales...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error al cargar sucursales</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={reloadBranches}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Gestión de Sucursales
        </h1>
        <p className="text-gray-600">
          Bienvenido, {user?.name}. Selecciona una sucursal o crea una nueva.
        </p>
      </div>

      {/* Botón Crear Sucursal */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <span>+</span>
          Crear Nueva Sucursal
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