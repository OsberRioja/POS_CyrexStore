import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor para agregar el token y branchId a todas las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Obtener branchId del localStorage
  const branchId = localStorage.getItem('selectedBranch');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userBranchId = user?.branchId;
  
  // Usar branchId seleccionado o el del usuario
  const currentBranchId = branchId ? parseInt(branchId) : userBranchId;

  // Agregar branchId a los parámetros de consulta para GET
  if (currentBranchId && config.method?.toLowerCase() === 'get' && config.params) {
    config.params.branchId = currentBranchId;
  }

  // Para POST, PUT, PATCH, agregar branchId al body si existe
  if (currentBranchId && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '') && config.data) {
    // Si es FormData, agregar branchId
    if (config.data instanceof FormData) {
      config.data.append('branchId', currentBranchId.toString());
    } 
    // Si es objeto JSON, agregar branchId
    else if (typeof config.data === 'object') {
      config.data = {
        ...config.data,
        branchId: currentBranchId
      };
    }
  }

  return config;
});

export default api;