import api from './api';
import type { CommissionReportResponse, CommissionSummaryResponse } from '../types/commissionReport';

export const CommissionReportService = {
  async getCommissionsByMonth(
    month: number, 
    year: number, 
    page: number = 1, 
    limit: number = 50
  ): Promise<CommissionReportResponse> {
    try {
      const response = await api.get('/commission-reports/by-month', {
        params: { month, year, page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en getCommissionsByMonth:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar comisiones por mes');
    }
  },

  async getSummaryByMonth(month: number, year: number): Promise<CommissionSummaryResponse> {
    try {
      const response = await api.get('/commission-reports/summary-by-month', {
        params: { month, year }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en getSummaryByMonth:', error);
      // Si es un 404 (no hay datos), devolver array vacío
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw new Error(error.response?.data?.message || 'Error al cargar resumen de comisiones');
    }
  },

  async getUserCommissionsReport(userId: string, startDate: string, endDate: string) {
    try {
      const response = await api.get(`/commission-reports/user/${userId}/report`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en getUserCommissionsReport:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar reporte de usuario');
    }
  },

  async getCommissionsByUserAndMonth(userId: string, month: number, year: number) {
    try {
      const response = await api.get(`/commission-reports/user/${userId}/by-month`, {
        params: { month, year }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en getCommissionsByUserAndMonth:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar comisiones por usuario');
    }
  },
};