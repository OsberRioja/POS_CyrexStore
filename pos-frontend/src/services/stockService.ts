import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

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
  }) => {
    return axios.get(`${API_URL}/stock/movements`, {
      params,
      headers: getAuthHeaders()
    });
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
  }) => {
    return axios.post(`${API_URL}/stock/purchase`, data, {
      headers: getAuthHeaders()
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
  }) => {
    return axios.post(`${API_URL}/stock/repair-out`, data, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Enviar a demo
   */
  registerDemoOut: (data: {
    productId: string;
    quantity: number;
    reason: string;
    notes?: string;
  }) => {
    return axios.post(`${API_URL}/stock/demo-out`, data, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Registrar devolución
   */
  registerReturn: (data: {
    saleId: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }) => {
    return axios.post(`${API_URL}/stock/return`, data, {
      headers: getAuthHeaders()
    });
  },

  /**
    * Obtener reparaciones activas
  */
  getActiveRepairs: () => {
    return axios.get(`${API_URL}/stock/active-repairs`, {
      headers: getAuthHeaders()
    });
  },

  /**
    * Obtener demos activas
  */
  getActiveDemos: () => {
    return axios.get(`${API_URL}/stock/active-demos`, {
      headers: getAuthHeaders()
    });
  },

  /**
    * Finalizar reparación
  */
  completeRepair: (movementId: number, data: {
    notes?: string;
    resolution?: string;
  }) => {
    return axios.post(`${API_URL}/stock/repair/${movementId}/complete`, data, {
      headers: getAuthHeaders()
    });
  },

  /**
    * Finalizar demo
  */
  completeDemo: (movementId: number, data: {
    notes?: string;
    resolution?: string;
  }) => {
    return axios.post(`${API_URL}/stock/demo/${movementId}/complete`, data, {
      headers: getAuthHeaders()
    });
  },


  // ========== PRODUCTOS ==========

  /**
   * Historial de un producto
   */
  getProductHistory: (productId: string) => {
    return axios.get(`${API_URL}/stock/product/${productId}/history`, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Actualizar precios
   */
  updatePrices: (productId: string, data: {
    costPrice?: number;
    salePrice?: number;
    notes?: string;
  }) => {
    return axios.put(`${API_URL}/stock/product/${productId}/prices`, data, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Historial de precios
   */
  getPriceHistory: (productId: string) => {
    return axios.get(`${API_URL}/stock/product/${productId}/price-history`, {
      headers: getAuthHeaders()
    });
  },

  // ========== RESUMEN ==========

  /**
   * Resumen de inventario
   */
  getSummary: () => {
    return axios.get(`${API_URL}/stock/summary`, {
      headers: getAuthHeaders()
    });
  }
};