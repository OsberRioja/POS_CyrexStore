import api from './api';

export interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SUPERVISOR" | "SELLER";
  userCode?: number;
  branchId?: number; // ← Ahora se incluirá automáticamente
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: "ADMIN" | "SUPERVISOR" | "SELLER";
  password?: string;
  branchId?: number;
}

export const userService = {
  // Obtener todos los usuarios
  getUsers: () => api.get('/users'),

  // Obtener usuario por ID
  getUserById: (id: string) => api.get(`/users/${id}`),

  // Crear usuario
  create: (payload: CreateUserPayload) => api.post('/users', payload),

  // Actualizar usuario
  update: (id: string, payload: UpdateUserPayload) => api.put(`/users/${id}`, payload),

  // Eliminar usuario
  delete: (id: string) => api.delete(`/users/${id}`),

  // Buscar usuarios
  search: (query: string) => api.get('/users', { params: { q: query } }),
};