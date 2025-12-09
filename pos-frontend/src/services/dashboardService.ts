import api from './api';
import type { BranchDashboardDTO, GeneralDashboardDTO } from '../types/dashboard';

export const dashboardService = {
  // Obtener dashboard de una sucursal específica
  async getBranchDashboard(branchId?: number, period: string = 'day', date?: string): Promise<BranchDashboardDTO> {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (period) params.period = period;
    if (date) params.date = date;

    const response = await api.get('/dashboard/branch', { params });
    return response.data;
  },

  // Obtener dashboard general (solo para admin global)
  async getGeneralDashboard(period: string = 'day', date?: string): Promise<GeneralDashboardDTO> {
    const params: any = {};
    if (period) params.period = period;
    if (date) params.date = date;

    const response = await api.get('/dashboard/general', { params });
    return response.data;
  }
};