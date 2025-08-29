// src/services/productService.ts
import axios from "axios";
import { authService } from "./authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const authHeader = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ProductPayload = {
  sku: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  category?: string;
  brand?: string;
  providerId?: number | null;
};

export const productService = {
  getAll: () => axios.get(`${BASE}/products`, { headers: { ...authHeader() } }),
  getById: (id: string) => axios.get(`${BASE}/products/${id}`, { headers: { ...authHeader() } }),
  create: (payload: ProductPayload) => axios.post(`${BASE}/products`, payload, { headers: { ...authHeader() } }),
  update: (id: string, payload: Partial<ProductPayload>) => axios.put(`${BASE}/products/${id}`, payload, { headers: { ...authHeader() } }),
  remove: (id: string) => axios.delete(`${BASE}/products/${id}`, { headers: { ...authHeader() } }),
};
