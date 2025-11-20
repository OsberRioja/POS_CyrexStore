import api from './api';
import type { CommissionConfig, CreateCommissionConfigDTO, UpdateCommissionConfigDTO } from '../types/commission';

export const CommissionConfigService = {
  async getActive(): Promise<CommissionConfig | null> {
    try {
      const response = await api.get('/commission-config/active');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getAll(): Promise<CommissionConfig[]> {
    const response = await api.get('/commission-config');
    return response.data;
  },

  async getById(id: string): Promise<CommissionConfig> {
    const response = await api.get(`/commission-config/${id}`);
    return response.data;
  },

  async create(data: CreateCommissionConfigDTO): Promise<CommissionConfig> {
    const response = await api.post('/commission-config', data);
    return response.data;
  },

  async update(id: string, data: UpdateCommissionConfigDTO): Promise<CommissionConfig> {
    const response = await api.put(`/commission-config/${id}`, data);
    return response.data;
  },

  async activate(id: string): Promise<CommissionConfig> {
    const response = await api.patch(`/commission-config/${id}/activate`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/commission-config/${id}`);
  },
};