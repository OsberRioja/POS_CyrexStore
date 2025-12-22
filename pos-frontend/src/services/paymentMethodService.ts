import api from './api';

export const paymentMethodService = {
  list: () => api.get('/payment-methods'),

  create: (payload: { name: string; isCash?: boolean }) =>
    api.post('/payment-methods', payload),

  update: (id: number, payload: { name?: string; isCash?: boolean }) =>
    api.put(`/payment-methods/${id}`, payload),

  remove: (id: number) =>
    api.delete(`/payment-methods/${id}`),

  summaryByBox: (cashBoxId: number) =>
    api.get(`/payment-methods/summary?cashBoxId=${cashBoxId}`)
};