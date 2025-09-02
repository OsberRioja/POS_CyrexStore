// src/services/clientService.ts
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const clientService = {
  search: (params?: { q?: string; page?: number; limit?: number }) =>
    axios.get(`${BASE}/clients`, { params: params ?? {} }),

  create: (data: any) => axios.post(`${BASE}/clients`, data),
  update: (id: number | string, data: any) => axios.put(`${BASE}/clients/${id}`, data),
  remove: (id: number | string) => axios.delete(`${BASE}/clients/${id}`),
  getClients: (params?: { q?: string; page?: number; limit?: number }) =>
    axios.get(`${BASE}/clients`, { params: params ?? {} }),
  getById: (id: number | string) => axios.get(`${BASE}/clients/${id}`),
};
