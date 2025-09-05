// src/services/saleService.ts
import axios from "axios";
import { authService } from "./authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const authHeader = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const saleService = {
  create: (payload: any) =>
    axios.post(`${BASE}/sales`, payload, { headers: { ...authHeader() } }),
  list: (params: any) =>
    axios.get(`${BASE}/sales`, { params, headers: { ...authHeader() } }),
  getById: (id: number) =>
    axios.get(`${BASE}/sales/${id}`, { headers: { ...authHeader() } }),
  //listByBox: (boxId: number, token?: string) => axios.get(`${BASE}/sales/bybox?cashBoxId=${boxId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
  listByBox: (cashBoxId: number, token?: string) => axios.get(`${BASE}/sales/bybox?boxId=${cashBoxId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
};
