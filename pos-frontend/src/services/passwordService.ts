import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export const passwordService = {
  // Cambiar contraseña (para usuarios que requieren cambio obligatorio)
  changePassword: (data: { newPassword: string }) => 
    axios.post(`${BASE}/auth/change-password`, data),

  // Cambiar contraseña (para usuarios que ya tienen sesión)
  updatePassword: (data: ChangePasswordRequest) =>
    axios.put(`${BASE}/users/change-password`, data),
};