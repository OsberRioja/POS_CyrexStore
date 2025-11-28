import api from './api';

export const cashboxService = {
  list: () => api.get('/cashbox'),
  getOpen: () => api.get('/cashbox/open'),
  getById: (id: number) => api.get(`/cashbox/${id}`),
  
  getClosePreview: (id: number) => api.get(`/cashbox/${id}/close-preview`),

  open: (payload: { initialAmount: number }) => api.post('/cashbox/open', payload),

  close: (id: number, payload: {
    realClosedAmount: number;
    observations?: string;
    cashCount?: any;
  }) => api.post(`/cashbox/${id}/close`, payload),
};