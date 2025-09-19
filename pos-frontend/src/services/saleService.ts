import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface CreateSalePayload {
  sellerUserCode?: number;
  sellerId?: string;
  client: any;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  payments: Array<{
    paymentMethodId: number;
    amount: number;
  }>;
  allowPartialPayment?: boolean; // NUEVO
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
    const response = await axios.post(`${API_URL}/sales`, payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async list(params: {
    page?: number;
    limit?: number;
    cashBoxId?: number;
    paymentStatus?: string; // NUEVO: filtrar por estado
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await axios.get(`${API_URL}/sales?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getById(id: string) {
    const response = await axios.get(`${API_URL}/sales/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // NUEVO: Completar pago de una venta
  async addPayment(saleId: string, payload: AddPaymentPayload) {
    const response = await axios.post(`${API_URL}/sales/${saleId}/payments`, payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // NUEVO: Obtener ventas pendientes
  async getPendingSales(params: { page?: number; limit?: number } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await axios.get(`${API_URL}/sales/pending?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async findByBox(cashBoxId: number) {
    const response = await axios.get(`${API_URL}/sales`, {
      params: { cashBoxId },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }
}

export const saleService = new SaleServiceClass();