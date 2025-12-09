import api from './api';
import type { BranchDashboardDTO, GeneralDashboardDTO } from '../types/dashboard';

export const dashboardService = {
  // Obtener dashboard de una sucursal específica
  async getBranchDashboard(branchId?: number, date?: string): Promise<BranchDashboardDTO> {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (date) params.date = date;

    const response = await api.get('/dashboard/branch', { params });
    return response.data;
  },

  // Obtener dashboard general (solo para admin global)
  async getGeneralDashboard(date?: string): Promise<GeneralDashboardDTO> {
    const params: any = {};
    if (date) params.date = date;

    const response = await api.get('/dashboard/general', { params });
    return response.data;
  }
};