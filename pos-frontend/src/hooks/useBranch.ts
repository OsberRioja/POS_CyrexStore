import { useAuth } from '../context/authContext';

// Hook para acceder fácilmente a la información de sucursal
export function useBranch() {
  const { user, currentBranchId, selectBranch } = useAuth();

  const isGlobalAdmin = user?.role === 'ADMIN' && user?.branchId === null;
  const canSwitchBranch = isGlobalAdmin;
  const userBranchId = user?.branchId;

  return {
    // Sucursal actual en contexto (para admin puede ser la seleccionada, para otros es la asignada)
    currentBranchId,
    // ID de sucursal del usuario (si está asignado a una)
    userBranchId,
    // Si es administrador global
    isGlobalAdmin,
    // Si puede cambiar de sucursal
    canSwitchBranch,
    // Función para cambiar sucursal (solo para admin global)
    selectBranch,
    // Verificar si tiene sucursal asignada
    hasBranch: !!currentBranchId,
  };
}