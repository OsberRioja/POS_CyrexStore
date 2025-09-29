import axios from 'axios';

// ✅ Usa ruta relativa para aprovechar el proxy de Vite
const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    const response = await axios.post(`${API_URL}/sales`, payload, {
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
  } = {}) {
    console.log('SaleService.list called with params:', params);
    
    const response = await axios.get(`${API_URL}/sales`, {
      params, // Axios maneja los query params automáticamente
      headers: this.getAuthHeaders()
    });
    
    console.log('SaleService.list - Response:', response.data);
    return response.data;
  }

  async getById(id: string) {
    const response = await axios.get(`${API_URL}/sales/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async addPayment(saleId: string, payload: AddPaymentPayload) {
    const response = await axios.post(`${API_URL}/sales/${saleId}/payments`, payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getPendingSales(params: { page?: number; limit?: number } = {}) {
    const response = await axios.get(`${API_URL}/sales/pending`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // async findByBox(cashBoxId: number) {
  //   const response = await axios.get(`${API_URL}/sales`, {
  //     params: { cashBoxId },
  //     headers: this.getAuthHeaders()
  //   });
  //   return response.data;
  // }

  async debug() {
    console.log('SaleService.debug - Making debug request');
    
    const response = await axios.get(`${API_URL}/sales/debug`, {
      headers: this.getAuthHeaders()
    });
    
    console.log('SaleService.debug - Response:', response.data);
    return response.data;
  }
}

export const saleService = new SaleServiceClass();