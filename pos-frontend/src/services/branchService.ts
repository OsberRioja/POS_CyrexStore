import api from './api';

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
  getAll: () => api.get<Branch[]>('/branches'),

  // Obtener una sucursal por ID
  getById: (id: number) => api.get<Branch>(`/branches/${id}`),

  // Crear una sucursal (solo admin)
  create: (data: { name: string; address?: string; phone?: string }) =>
    api.post<Branch>('/branches', data),

  // Actualizar una sucursal (solo admin)
  update: (id: number, data: { name?: string; address?: string; phone?: string; isActive?: boolean }) =>
    api.put<Branch>(`/branches/${id}`, data),

  // Eliminar (desactivar) una sucursal (solo admin)
  delete: (id: number) => api.delete<Branch>(`/branches/${id}`),
};