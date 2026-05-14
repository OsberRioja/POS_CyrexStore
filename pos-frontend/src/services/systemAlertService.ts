import api from './api';
import type { SystemAlert, SystemAlertListResponse } from '../types/systemAlert';

export interface ListSystemAlertsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export const systemAlertService = {
  async list(params?: ListSystemAlertsParams): Promise<SystemAlertListResponse> {
    const response = await api.get<SystemAlertListResponse>('/system-alerts', { params });
    return response.data;
  },

  async markAsRead(id: number): Promise<SystemAlert> {
    const response = await api.patch<SystemAlert>(`/system-alerts/${id}/read`);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/system-alerts/${id}`);
  },
};
