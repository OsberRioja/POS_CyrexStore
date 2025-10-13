// src/services/cashboxService.ts
import axios from "axios";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const cashboxService = {
  list: (token?: string) => axios.get(`${BASE}/cashbox`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
  getOpen: (token?: string) => axios.get(`${BASE}/cashbox/open`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
  getById: (id: number, token?: string) => axios.get(`${BASE}/cashbox/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),

  getClosePreview: (id: number, token?: string) => 
    axios.get(`${BASE}/cashbox/${id}/close-preview`, { 
      headers: token ? { Authorization: `Bearer ${token}` } : undefined 
  }),

  open: (payload: { initialAmount: number }, token?: string) => axios.post(`${BASE}/cashbox/open`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
  close: (id: number, payload?: any, token?: string) => axios.post(`${BASE}/cashbox/${id}/close`, payload ?? {}, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
};
