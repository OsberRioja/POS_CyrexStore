import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboard(branchId?: number) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        let dashboardData;
        
        if (branchId) {
          dashboardData = await dashboardService.getBranchDashboard(branchId);
        } else {
          dashboardData = await dashboardService.getGeneralDashboard();
        }
        
        setData(dashboardData);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [branchId]);

  const refetch = async () => {
    setLoading(true);
    try {
      let dashboardData;
      
      if (branchId) {
        dashboardData = await dashboardService.getBranchDashboard(branchId);
      } else {
        dashboardData = await dashboardService.getGeneralDashboard();
      }
      
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al recargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}