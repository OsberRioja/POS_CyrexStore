import api from './api';

export const cashboxService = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/cashbox', { params }),

  getOpen: () => api.get('/cashbox/open'),
  getById: (id: number) => api.get(`/cashbox/${id}`),

  getClosePreview: (id: number) => api.get(`/cashbox/${id}/close-preview`),

  open: (payload: { initialAmount: number }) => api.post('/cashbox/open', payload),

  close: (id: number, payload: {
    realClosedAmount: number;
    observations?: string;
    cashCount?: any;
  }) => api.post(`/cashbox/${id}/close`, payload),

  reopen: async (boxId: number) => {
    const response = await api.post(`/cashbox/${boxId}/reopen`);
    return response.data;
  },

  closeReopened: async (boxId: number) => {
    const response = await api.post(`/cashbox/${boxId}/close-reopened`);
    return response.data;
  },

  getReopenPreview: async (boxId: number) => {
    const response = await api.get(`/cashbox/${boxId}/reopen-preview`);
    return response.data;
  }
};