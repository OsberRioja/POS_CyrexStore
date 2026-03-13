import api from './api';
import type { MasterProduct } from './masterProductService';

export interface ProductItem {
  id: string;
  serialNumber: string;
  masterProductId: string;
  masterProduct?: MasterProduct;
  branchId: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'DEFECTIVE' | 'RETURNED' | 'MAINTENANCE' | 'LOST';
  costPrice: number;
  
  salePrice: number;
  currency: string;
  purchaseItemId?: number;
  saleId?: string;
  purchasedAt?: string;
  soldAt?: string;
}

// Para validar un número de serie antes de agregarlo a la venta
export interface ValidateSerialResponse {
  valid: boolean;
  productItem?: ProductItem;
  message?: string;
}

export const productItemService = {
  // Validar un número de serie en la sucursal actual
  validate: (serialNumber: string) => api.get<ValidateSerialResponse>(`/product-items/validate/${serialNumber}`),

  // Obtener items disponibles de un producto maestro en una sucursal
  getAvailableByMasterProduct: (masterProductId: string, branchId?: number) => 
    api.get(`/product-items/available`, { params: { masterProductId, branchId } }),

  // Obtener items por sucursal (para inventario)
  getByBranch: (branchId: number, status?: string) => 
    api.get(`/product-items/branch/${branchId}`, { params: { status } }),
};