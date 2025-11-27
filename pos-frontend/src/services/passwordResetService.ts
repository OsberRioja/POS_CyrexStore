import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const passwordResetService = {
  // Solicitar enlace de recuperación
  requestReset: (email: string) =>
    axios.post(`${BASE}/auth/forgot-password`, { email }),

  // Validar token
  validateToken: (token: string) =>
    axios.post(`${BASE}/auth/validate-reset-token`, { token }),

  // Restablecer contraseña
  resetPassword: (data: ResetPasswordRequest) =>
    axios.post(`${BASE}/auth/reset-password`, data),
};