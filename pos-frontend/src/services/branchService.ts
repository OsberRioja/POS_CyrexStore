import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const branchService = {
  // Obtener todas las sucursales
  getAll: () => 
    axios.get<Branch[]>(`${BASE}/branches`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),

  // Obtener una sucursal por ID
  getById: (id: number) =>
    axios.get<Branch>(`${BASE}/branches/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),

  // Crear una sucursal (solo admin)
  create: (data: { name: string; address?: string; phone?: string }) =>
    axios.post<Branch>(`${BASE}/branches`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),

  // Actualizar una sucursal (solo admin)
  update: (id: number, data: { name?: string; address?: string; phone?: string; isActive?: boolean }) =>
    axios.put<Branch>(`${BASE}/branches/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),

  // Eliminar (desactivar) una sucursal (solo admin)
  delete: (id: number) =>
    axios.delete<Branch>(`${BASE}/branches/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),
};