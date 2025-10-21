import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const userPreferenceService = {
  /**
   * Obtener preferencias del usuario actual
   */
  getMyPreferences: () => {
    return axios.get(`${API_URL}/user-preferences`, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Actualizar moneda preferida
   */
  updateCurrency: (currency: string) => {
    return axios.put(`${API_URL}/user-preferences/currency`, {
      currency
    }, {
      headers: getAuthHeaders()
    });
  }
};