import api from './api';

export const promotionService = {
  list: async () => (await api.get('/promotions')).data,
  create: async (data: any) => (await api.post('/promotions', data)).data,
  update: async (id: string, data: any) => (await api.put(`/promotions/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/promotions/${id}`)).data,
};
