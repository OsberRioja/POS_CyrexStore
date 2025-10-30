import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const exchangeRateService = {
  /**
   * Listar todas las tasas
   */
  listAll: () => {
    return axios.get(`${API_URL}/exchange-rates`, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Obtener tasa específica
   */
  getRate: (from: string, to: string) => {
    return axios.get(`${API_URL}/exchange-rates/rate`, {
      params: { from, to },
      headers: getAuthHeaders()
    });
  },

  /**
   * Convertir monto
   */
  convert: (amount: number, fromCurrency: string, toCurrency: string) => {
    return axios.post(`${API_URL}/exchange-rates/convert`, {
      amount,
      fromCurrency,
      toCurrency
    }, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Actualizar desde API (solo admin)
   */
  updateFromAPI: () => {
    return axios.post(`${API_URL}/exchange-rates/update-api`, {}, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Actualizar tasa manual (solo admin)
   */
  updateManual: (fromCurrency: string, toCurrency: string, rate: number, notes?: string) => {
    return axios.post(`${API_URL}/exchange-rates/manual`, {
      fromCurrency,
      toCurrency,
      rate,
      notes
    }, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Alternar tasa manual/automática (solo admin)
   */
  toggleManual: (fromCurrency: string, toCurrency: string, useManual: boolean) => {
    return axios.post(`${API_URL}/exchange-rates/toggle`, {
      fromCurrency,
      toCurrency,
      useManual
    }, {
      headers: getAuthHeaders()
    });
  }
};