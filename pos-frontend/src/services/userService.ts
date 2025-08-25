import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getUsers = () => axios.get(`${BASE}/users`);
export const createUser = (data: any) => axios.post(`${BASE}/users`, data);
export const updateUser = (id: string, data: any) => axios.put(`${BASE}/users/${id}`, data);
export const deleteUser = (id: string) => axios.delete(`${BASE}/users/${id}`);