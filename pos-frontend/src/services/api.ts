import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor para agregar el token y branchId a TODAS las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Obtener branchId del localStorage o del usuario
  const selectedBranch = localStorage.getItem('selectedBranch');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userBranchId = user?.branchId;
  
  // Prioridad: selectedBranch > userBranchId
  const currentBranchId = selectedBranch ? parseInt(selectedBranch) : userBranchId;

  console.log('🔧 Interceptor - Current Branch ID:', currentBranchId);
  console.log('🔧 Interceptor - Request Method:', config.method);
  console.log('🔧 Interceptor - Request Data:', config.data);

  // Agregar branchId a los parámetros de consulta para GET
  if (currentBranchId && config.method?.toLowerCase() === 'get') {
    config.params = {
      ...config.params,
      branchId: currentBranchId
    };
  }

  // Para POST, PUT, PATCH, agregar branchId al body si existe
  if (currentBranchId && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
    // Si es FormData, agregar branchId
    if (config.data instanceof FormData) {
      config.data.append('branchId', currentBranchId.toString());
    } 
    // Si es objeto JSON, agregar branchId
    else if (typeof config.data === 'object' && config.data !== null) {
      config.data = {
        ...config.data,
        branchId: currentBranchId
      };
    }
    // Si no hay data, crear objeto con branchId
    else if (!config.data) {
      config.data = { branchId: currentBranchId };
    }
  }

  return config;
});

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - hacer logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedBranch');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;