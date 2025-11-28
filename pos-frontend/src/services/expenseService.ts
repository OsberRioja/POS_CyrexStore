// src/services/expenseService.ts
import api from "./api";

export const expenseService = {
  create: (payload: any) => api.post(`/expenses`, payload),
  listByBox: (boxId: number) => api.get(`/expenses/by-box?boxId=${boxId}`),
};
