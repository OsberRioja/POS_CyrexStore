import { useAuth } from '../context/authContext';
import { useState, useEffect } from 'react';
import { branchService } from '../services/branchService';
import type { Branch } from '../services/branchService';

export function useBranch() {
  const { user, currentBranchId, selectBranch } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const isGlobalAdmin = user?.role === 'ADMIN' && user?.branchId === null;
  const canSwitchBranch = isGlobalAdmin;
  const userBranchId = user?.branchId;

  // Cargar sucursales si es administrador global
  useEffect(() => {
    if (isGlobalAdmin) {
      setLoading(true);
      branchService.getAll()
        .then(response => {
          setBranches(response.data);
        })
        .catch(error => {
          console.error('Error cargando sucursales:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isGlobalAdmin]);

  return {
    // Sucursal actual en contexto
    currentBranchId,
    // ID de sucursal del usuario (si está asignado a una)
    userBranchId,
    // Lista de sucursales (solo para admin global)
    branches,
    // Si es administrador global
    isGlobalAdmin,
    // Si puede cambiar de sucursal
    canSwitchBranch,
    // Función para cambiar sucursal (solo para admin global)
    selectBranch,
    // Verificar si tiene sucursal asignada
    hasBranch: !!currentBranchId,
    // Estado de carga
    loading,
  };
}