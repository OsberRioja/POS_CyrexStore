import axios from "axios";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getProviders = () => axios.get(`${BASE}/providers`);
export const createProvider = (data: any) => axios.post(`${BASE}/providers`, data);
export const updateProvider = (id: number | string, data: any) => axios.put(`${BASE}/providers/${id}`, data);
export const deleteProvider = (id: number | string) => axios.delete(`${BASE}/providers/${id}`);
