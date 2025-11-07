import axios from "axios";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getProviders = () => axios.get(`${BASE}/providers`, {headers: getAuthHeaders() });
export const createProvider = (data: any) => axios.post(`${BASE}/providers`, data, {headers: getAuthHeaders() });
export const updateProvider = (id: number | string, data: any) => axios.put(`${BASE}/providers/${id}`, data, {headers: getAuthHeaders() });
export const deleteProvider = (id: number | string) => axios.delete(`${BASE}/providers/${id}`, {headers: getAuthHeaders() });
