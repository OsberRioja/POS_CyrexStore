import api from './api';

export const clientService = {
  search: (params?: { q?: string; page?: number; limit?: number }) =>
    api.get('/clients', { params: params ?? {} }),

  create: (data: any) => api.post('/clients', data),
  
  update: (id: number | string, data: any) => api.put(`/clients/${id}`, data),
  
  remove: (id: number | string) => api.delete(`/clients/${id}`),
  
  getClients: (params?: { q?: string; page?: number; limit?: number }) =>
    api.get('/clients', { params: params ?? {} }),
    
  getById: (id: number | string) => api.get(`/clients/${id}`),
};