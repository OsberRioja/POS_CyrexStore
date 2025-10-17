import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface CreateReturnPayload {
  saleId: string;
  reason: string;
  items: Array<{
    productId: string;
    quantityReturned: number;
    unitPrice: number;
    condition?: string;
  }>;
  refundMethod: string;
  notes?: string;
}

class ReturnServiceClass {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async create(payload: CreateReturnPayload) {
    const response = await axios.post(`${API_URL}/returns`, payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async list(params?: { page?: number; limit?: number; saleId?: string }) {
    const response = await axios.get(`${API_URL}/returns`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getById(id: number) {
    const response = await axios.get(`${API_URL}/returns/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async approve(id: number) {
    const response = await axios.post(`${API_URL}/returns/${id}/approve`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }
}

export const returnService = new ReturnServiceClass();