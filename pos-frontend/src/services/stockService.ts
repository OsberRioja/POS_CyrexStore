import api from "./api";

export const stockService = {
  // ========== MOVIMIENTOS ==========
  
  /**
   * Listar movimientos con filtros
   */
  listMovements: (params?: {
    productId?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    saleId?: string;
  }) => {
    return api.get(`/stock/movements`, { params });
  },

  /**
   * Registrar compra de stock
   */
  registerPurchase: (data: {
    productId: string;
    quantity: number;
    unitCost: number;
    providerId?: number;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.post(`/stock/purchase`, data);
  },


  registerPurchaseBatch: (data: {
    purchases: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
      providerId?: number;
      notes?: string;
      serialNumbers?: string[];
    }>;
  }) => {
    return api.post(`/stock/purchase-batch`, data);
  },


  listPurchases: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    productId?: string;
  }) => {
    return api.get(`/stock/movements`, {
      params: {
        ...params,
        movementType: 'PURCHASE'
      }
    });
  },

  /**
   * Enviar a reparación
   */
  registerRepairOut: (data: {
    productId: string;
    quantity: number;
    reason: string;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.post(`/stock/repair-out`, data);
  },

  /**
   * Enviar a demo
   */
  registerDemoOut: (data: {
    productId: string;
    quantity: number;
    reason: string;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.post(`/stock/demo-out`, data);
  },

  /**
   * Registrar devolución
   */
  registerReturn: (data: {
    saleId: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.post(`/stock/return`, data);
  },

  /**
    * Obtener reparaciones activas
  */
  getActiveRepairs: () => {
    return api.get(`/stock/active-repairs`);
  },

  /**
    * Obtener demos activas
  */
  getActiveDemos: () => {
    return api.get(`/stock/active-demos`);
  },

  /**
    * Finalizar reparación
  */
  completeRepair: (movementId: number, data: {
    notes?: string;
    resolution?: string;
  }) => {
    return api.post(`/stock/repair/${movementId}/complete`, data);
  },

  /**
    * Finalizar demo
  */
  completeDemo: (movementId: number, data: {
    notes?: string;
    resolution?: string;
  }) => {
    return api.post(`/stock/demo/${movementId}/complete`, data);
  },


  // ========== PRODUCTOS ==========


  getAvailableSerials: (productId: string) => {
    return api.get(`/stock/product/${productId}/available-serials`);
  },

  /**
   * Historial de un producto
   */
  getProductHistory: (productId: string) => {
    return api.get(`/stock/product/${productId}/history`);
  },

  /**
   * Actualizar precios
   */
  updatePrices: (productId: string, data: {
    costPrice?: number;
    salePrice?: number;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.put(`/stock/product/${productId}/prices`, data);
  },

  /**
   * Historial de precios
   */
  getPriceHistory: (productId: string) => {
    return api.get(`/stock/product/${productId}/price-history`);
  },

  // ========== RESUMEN ==========

  /**
   * Resumen de inventario
   */
  getSummary: () => {
    return api.get(`/stock/summary`);
  },

  searchBySaleId: (saleId: string) => {
    return api.get(`/stock/movements`, {
      params: { saleId, movementType: 'SALE' }
    });
  },

  /**
   * Registrar ajuste de stock
   */
  registerAdjustment: (data: {
    productId: string;
    quantity: number; // Positivo o negativo
    reason: string;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.post(`/stock/adjustment`, data);
  },

  /**
   * Registrar salida por uso interno
   */
  registerInternalUseOut: (data: {
    productId: string;
    quantity: number;
    reason: string;
    destination?: string;
    expectedReturnDate?: string;
    notes?: string;
    serialNumbers?: string[];
  }) => {
    return api.post(`/stock/internal-use-out`, data);
  },

  /**
   * Obtener usos internos activos
   */
  getActiveInternalUses: () => {
    return api.get(`/stock/active-internal-uses`);
  },

  /**
   * Retornar producto de uso interno
   */
  returnInternalUse: (movementId: number, data: {
    notes?: string;
    condition?: string;
  }) => {
    return api.post(`/stock/internal-use/${movementId}/return`, data);
  },
};  