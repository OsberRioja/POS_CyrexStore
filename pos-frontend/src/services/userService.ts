// src/services/userService.ts
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const userService = {
  create: (data: any) => axios.post(`${BASE}/users`, data),
  update: (id: string, data: any) => axios.put(`${BASE}/users/${id}`, data),
  remove: (id: string) => axios.delete(`${BASE}/users/${id}`),

  // obtener lista con búsqueda opcional
  getUsers: (q?: string) => axios.get(`${BASE}/users`, { params: q ? { q } : {} }),

  // 🔎 nuevo: buscar vendedor por código
  getByUsercode: (userCode: number, token?: string) =>
    axios.get(`${BASE}/users/code/${userCode}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
};
