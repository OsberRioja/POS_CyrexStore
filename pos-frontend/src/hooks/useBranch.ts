// En src/hooks/useBranch.ts - OPTIMIZAR
import { useAuth } from '../context/authContext';
import { useState, useEffect, useCallback } from 'react';
import { branchService } from '../services/branchService';
import type { Branch } from '../services/branchService';

export function useBranch() {
  const { user, currentBranchId, selectBranch, isInBranchMode, enterBranch, exitToAdminHome } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGlobalAdmin = user?.role === 'ADMIN' && user?.branchId === null;
  const canSwitchBranch = isGlobalAdmin && isInBranchMode;

  // Función para recargar branches
  const reloadBranches = useCallback(async () => {
    if (!isGlobalAdmin) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await branchService.getAll();
      setBranches(response.data);
    } catch (err: any) {
      console.error('Error cargando sucursales:', err);
      // Manejar diferentes tipos de error
      if (err.response?.status === 404) {
        setError('Servicio de sucursales no disponible');
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para ver sucursales');
      } else {
        setError('Error al cargar sucursales');
      }
    } finally {
      setLoading(false);
    }
  }, [isGlobalAdmin]);

  // Cargar sucursales si es administrador global
  useEffect(() => {
    reloadBranches();
  }, [reloadBranches]);

  // Función para crear sucursal
  const createBranch = useCallback(async (branchData: { name: string; address?: string; phone?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await branchService.create(branchData);
      // Recargar la lista después de crear
      await reloadBranches();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al crear sucursal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reloadBranches]);

  return {
    // Estados
    currentBranchId,
    userBranchId: user?.branchId,
    branches,
    isGlobalAdmin,
    canSwitchBranch,
    isInBranchMode,
    loading,
    error,
    
    // Acciones
    selectBranch,
    enterBranch,
    exitToAdminHome,
    reloadBranches,
    createBranch,
    
    // Utilidades
    hasBranch: !!currentBranchId,
    activeBranches: branches.filter(branch => branch.isActive),
    inactiveBranches: branches.filter(branch => !branch.isActive),
  };
}