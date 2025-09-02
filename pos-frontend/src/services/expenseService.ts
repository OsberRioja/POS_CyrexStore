// src/services/expenseService.ts
import axios from "axios";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const expenseService = {
  create: (payload: any, token?: string) => axios.post(`${BASE}/expenses`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
  listByBox: (boxId: number, token?: string) => axios.get(`${BASE}/expenses/by-box?boxId=${boxId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
};
