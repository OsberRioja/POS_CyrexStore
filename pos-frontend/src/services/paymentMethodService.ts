// src/services/paymentMethodService.ts
import axios from "axios";
import { authService } from "./authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const authHeader = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const paymentMethodService = {
  list: () => axios.get(`${BASE}/payment-methods`, { headers: { ...authHeader() } }),
};
