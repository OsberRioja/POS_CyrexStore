import axios from 'axios';
import { ApiErrorHandler } from './apiErrorHandler';

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const passwordResetService = {
  // Solicitar enlace de recuperación
  async requestReset(email: string) {
    try {
      const response = await axios.post(`${BASE}/auth/forgot-password`, { email });
      return response.data;
    } catch (error: any) {
      throw new Error(ApiErrorHandler.handle(error));
    }
  },

  // Validar token
  validateToken: (token: string) =>
    axios.post(`${BASE}/auth/validate-reset-token`, { token }),

  // Restablecer contraseña
  resetPassword: (data: ResetPasswordRequest) =>
    axios.post(`${BASE}/auth/reset-password`, data),
};