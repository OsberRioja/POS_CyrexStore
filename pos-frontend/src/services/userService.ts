import api from './api';

export interface CreateUserPayload {
  firstName: string;
  lastNamePaterno: string;
  lastNameMaterno: string;
  email: string;
  countryCode: string;
  country: string;
  phone: string;
  role: "ADMIN" | "SUPERVISOR" | "SELLER";
  userCode?: number;
  branchId?: number;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  email?: string;
  countryCode?: string;
  country?: string;
  phone?: string;
  role?: "ADMIN" | "SUPERVISOR" | "SELLER";
  password?: string;
  branchId?: number;
}

export const userService = {
  getUsers: () => api.get('/users'),
  getUserById: (id: string) => api.get(`/users/${id}`),
  create: (payload: CreateUserPayload) => api.post('/users', payload),
  update: (id: string, payload: UpdateUserPayload) => api.put(`/users/${id}`, payload),
  delete: (id: string) => api.delete(`/users/${id}`),
  search: (query: string) => api.get('/users', { params: { q: query } }),
};
