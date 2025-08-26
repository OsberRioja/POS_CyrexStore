import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getClients = (params?: { q?: string; page?: number; limit?: number }) =>
  axios.get(`${BASE}/clients`, { params: params ?? {} });

export const createClient = (data: any) => axios.post(`${BASE}/clients`, data);
export const updateClient = (id: number | string, data: any) => axios.put(`${BASE}/clients/${id}`, data);
export const deleteClient = (id: number | string) => axios.delete(`${BASE}/clients/${id}`);
