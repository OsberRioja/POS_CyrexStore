// src/pages/AdminHomePage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";
import BranchCard from "../components/BranchCard";
import BranchFormModal from "../components/BranchFormModal";
import type { Branch } from "../services/branchService";

export default function AdminHomePage() {
  const { user } = useAuth();
  const { branches, loading, error } = useBranch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeBranches, setActiveBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (branches) {
      setActiveBranches(branches.filter(branch => branch.isActive));
    }
  }, [branches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Cargando sucursales...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-600">Error: {error}</div>
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
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
              onSelect={() => {
                // Esta función se implementará en la siguiente subtarea
                console.log('Seleccionar sucursal:', branch.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No hay sucursales activas
          </h3>
          <p className="text-gray-500">
            Comienza creando la primera sucursal del sistema.
          </p>
        </div>
      )}

      {/* Modal para crear sucursal */}
      {showCreateModal && (
        <BranchFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Recargar branches se manejará en el hook
          }}
        />
      )}
    </div>
  );
}