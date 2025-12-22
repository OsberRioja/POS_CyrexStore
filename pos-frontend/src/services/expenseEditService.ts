import api from './api';

export const expenseEditService = {
    update: async (expenseId: number, data: any) => {
        const response = await api.put(`/expenses-edit/${expenseId}`, data);
        return response.data;
    },
};