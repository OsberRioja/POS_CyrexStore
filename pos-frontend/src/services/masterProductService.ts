import api from './api';

export interface MasterProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  suggestedCostPrice?: number;
  suggestedSalePrice?: number;
  priceCurrency: string;
  providerId?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateMasterProductPayload {
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  suggestedCostPrice?: number;
  suggestedSalePrice?: number;
  priceCurrency?: string;
  providerId?: number | null;
}

export interface UpdateMasterProductPayload {
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  suggestedCostPrice?: number;
  suggestedSalePrice?: number;
  priceCurrency?: string;
  providerId?: number | null;
  isActive?: boolean;
}

export const masterProductService = {
  // Crear producto maestro
  create: (payload: CreateMasterProductPayload) => api.post('/master-products', payload),

  // Listar todos (con opción de incluir inactivos)
  getAll: (includeInactive = false) => api.get('/master-products', { params: { includeInactive } }),

  // Obtener por ID
  getById: (id: string) => api.get(`/master-products/${id}`),

  // Actualizar
  update: (id: string, payload: UpdateMasterProductPayload) => api.put(`/master-products/${id}`, payload),

  // Desactivar/activar
  deactivate: (id: string) => api.patch(`/master-products/${id}/deactivate`, {}),
  activate: (id: string) => api.patch(`/master-products/${id}/activate`, {}),

  // Eliminar (solo si no tiene items)
  delete: (id: string) => api.delete(`/master-products/${id}`),

  // Buscar por SKU o nombre (usando query param `q`)
  search: (q: string) => api.get('/master-products', { params: { q, onlyActive: true } }),

  // Obtener stock por sucursal
  getStockByBranch: (id: string) => api.get(`/master-products/${id}/stock`),
};