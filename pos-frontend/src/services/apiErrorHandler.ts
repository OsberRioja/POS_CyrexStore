export class ApiErrorHandler {
  static handle(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return 'Error de conexión. Verifica tu internet.';
    }
    
    if (error.code === 'ERR_BAD_REQUEST') {
      return 'Error en la solicitud. Verifica los datos.';
    }
    
    if (error.code === 'ERR_BAD_RESPONSE') {
      return 'Error del servidor. Intenta nuevamente.';
    }
    
    return 'Error inesperado. Por favor, intenta nuevamente.';
  }
  
  static isAuthError(error: any): boolean {
    return error.response?.status === 401 || error.response?.status === 403;
  }
}