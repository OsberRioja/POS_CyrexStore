import api from './api';

export const saleEditService = {
    update: async (saleId: string, data: any) => {
        const response = await api.put(`/sales-edit/${saleId}`, data);
        return response.data;
    },

    getForEdit: async (saleId: string) => {
        const response = await api.get(`/sales-edit/${saleId}/edit-data`);
        return response.data;
    }
};