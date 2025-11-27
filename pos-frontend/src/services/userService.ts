// src/services/userService.ts
import axios from "axios";
import { ApiErrorHandler } from "./apiErrorHandler";
import  api  from "./api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const userService = {
  create: (data: any) => axios.post(`${BASE}/users`, data),
  update: (id: string, data: any) => axios.put(`${BASE}/users/${id}`, data),
  //remove: (id: string) => axios.delete(`${BASE}/users/${id}`),

  // obtener lista con búsqueda opcional
  getUsers: (q?: string) => axios.get(`${BASE}/users`, { params: q ? { q } : {} }),

  // 🔎 nuevo: buscar vendedor por código
  getByUsercode: (userCode: number, token?: string) =>
    axios.get(`${BASE}/users/code/${userCode}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }),

  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decodificar el token JWT para obtener información del usuario
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        userCode: payload.userCode
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },
  
  hasRole: (requiredRole: string) => {
    const user = userService.getCurrentUser();
    return user?.role === requiredRole;
  },
  
  hasAnyRole: (requiredRoles: string[]) => {
    const user = userService.getCurrentUser();
    return requiredRoles.includes(user?.role || '');
  },

  async remove(id: string) {
    try {
      const response = await api.delete(`${BASE}/users/${id}`);
      return response.data;
  } catch (error) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }
};
