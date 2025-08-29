import axios from "axios";
import { authService } from "./authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export type Supplier = {
  id_provider?: number; // backend puede devolver id_provider
  id?: number;          // o id
  name: string;
  phone?: string;
  createdAt?: string;
};

const authHeader = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const supplierService = {
  getAll: () => axios.get(`${BASE}/providers`, { headers: { ...authHeader() } }),
  getById: (id: number | string) => axios.get(`${BASE}/providers/${id}`, { headers: { ...authHeader() } }),
  create: (data: { name: string; phone?: string }) => axios.post(`${BASE}/providers`, data, { headers: { ...authHeader() } }),
  update: (id: number | string, data: any) => axios.put(`${BASE}/providers/${id}`, data, { headers: { ...authHeader() } }),
  remove: (id: number | string) => axios.delete(`${BASE}/providers/${id}`, { headers: { ...authHeader() } }),
};
