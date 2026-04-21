import api from "./api";

interface CreateSalePayload {
  sellerUserCode?: number;
  sellerId?: string;
  client: any;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    serialNumbers?: string[];
  }>;
  payments: Array<{
    paymentMethodId: number;
    amount: number;
  }>;
  allowPartialPayment?: boolean;
  cashBoxId?: number;
}

interface AddPaymentPayload {
  paymentMethodId: number;
  amount: number;
  cashBoxId?: number;
}

class SaleServiceClass {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async create(payload: CreateSalePayload) {
    const response = await api.post('/sales', payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async list(params: {
    page?: number;
    limit?: number;
    cashBoxId?: number;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {}) {
    console.log('SaleService.list called with params:', params);
    
    const response = await api.get('/sales', {
      params, // Axios maneja los query params automáticamente
      headers: this.getAuthHeaders()
    });
    
    console.log('SaleService.list - Response:', response.data);
    return response.data;
  }

  async getById(id: string) {
    const response = await api.get(`/sales/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async addPayment(saleId: string, payload: AddPaymentPayload) {
    const response = await api.post(`/sales/${saleId}/payments`, payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getPendingSales(params: { page?: number; limit?: number } = {}) {
    const response = await api.get('/sales/pending', {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async searchById(id: string) {
    const response = await api.get(`/sales/search/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async debug() {
    console.log('SaleService.debug - Making debug request');
    
    const response = await api.get('/sales/debug', {
      headers: this.getAuthHeaders()
    });
    
    console.log('SaleService.debug - Response:', response.data);
    return response.data;
  }
}

export const saleService = new SaleServiceClass();
