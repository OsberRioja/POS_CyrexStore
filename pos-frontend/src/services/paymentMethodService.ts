// src/services/paymentMethodService.ts
import axios from "axios";
import { authService } from "./authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const authHeader = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const paymentMethodService = {
  list: (token?: string) => axios.get(`${BASE}/payment-methods`, { headers: { ...authHeader(), ...(token ? { Authorization: `Bearer ${token}`} : {}) } }),
  create: (payload: { name: string; isCash?: boolean }, token?: string) => axios.post(`${BASE}/payment-methods`, payload, { headers: { ...authHeader(), ...(token ? { Authorization: `Bearer ${token}`} : {}) } }),
  update: (id: number, payload: { name?: string; isCash?: boolean }, token?: string) => axios.put(`${BASE}/payment-methods/${id}`, payload, { headers: { ...authHeader(), ...(token ? { Authorization: `Bearer ${token}`} : {}) } }),
  remove: (id: number, token?: string) => axios.delete(`${BASE}/payment-methods/${id}`, { headers: { ...authHeader(), ...(token ? { Authorization: `Bearer ${token}`} : {}) } }),
  summaryByBox: (cashBoxId: number) => axios.get(`${BASE}/payment-methods/summary?cashBoxId=${cashBoxId}`, { headers: { ...authHeader() } })

};
