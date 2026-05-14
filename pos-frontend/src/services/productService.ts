import api from './api';

export type ProductPayload = {
  sku?: string;
  codigoInterno: string;
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
  applyToAllBranches?: boolean;
};

export type ProductSearchParams = {
  q?: string;
  onlyActive?: boolean;
  onlyInStock?: boolean;
  branchId?: number;
};

export type ProductMetadata = {
  categories: string[];
  brands: string[];
};

export type GlobalStockBranch = {
  branchId: number;
  branchName: string;
  stock: number;
};

export type GlobalStockProduct = {
  codigoInterno: string;
  sku: string | null;
  name: string;
  category: string | null;
  brand: string | null;
  branches: GlobalStockBranch[];
  totalStock: number;
};

export type GlobalStockResponse = {
  data: GlobalStockProduct[];
  branches: { id: number; name: string }[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  metadata: { categories: string[]; brands: string[] };
};

export type GlobalStockParams = {
  q?: string;
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'sku' | 'codigoInterno' | 'category' | 'brand' | 'totalStock';
  sortDir?: 'asc' | 'desc';
};

export const productService = {
  getAll: (params?: ProductSearchParams) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (payload: ProductPayload) => api.post('/products', payload),
  update: (id: string, payload: Partial<ProductPayload>) => api.put(`/products/${id}`, payload),
  remove: (id: string) => api.delete(`/products/${id}`),
  search: (params?: ProductSearchParams) => api.get('/products', { params: params ?? {} }),
  getMetadata: (branchId?: number) => api.get<ProductMetadata>('/products/metadata', { params: branchId ? { branchId } : {} }),
  getGlobalStock: (params?: GlobalStockParams) => api.get<GlobalStockResponse>('/products/global-stock', { params: params ?? {} }),
  deactivate: (id: string) => api.patch(`/products/${id}/deactivate`, {}),
  activate: (id: string) => api.patch(`/products/${id}/activate`, {}),
  getNextCodigoInterno: () => api.get('/products/next-codigo-interno'),
};
