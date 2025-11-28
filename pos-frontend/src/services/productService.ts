import api from './api';

export type ProductPayload = {
  sku: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  priceCurrency: string;
  stock: number;
  category?: string;
  brand?: string;
  providerId?: number | null;
  imageUrl?: string;
};

export type ProductSearchParams = {
  q?: string;
  onlyActive?: boolean;
};

export const productService = {
  getAll: (params?: ProductSearchParams) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (payload: ProductPayload) => api.post('/products', payload),
  update: (id: string, payload: Partial<ProductPayload>) => api.put(`/products/${id}`, payload),
  remove: (id: string) => api.delete(`/products/${id}`),
  search: (params?: ProductSearchParams) => api.get('/products', { params: params ?? {} }),
  deactivate: (id: string) => api.patch(`/products/${id}/deactivate`, {}),
  activate: (id: string) => api.patch(`/products/${id}/activate`, {}),
};