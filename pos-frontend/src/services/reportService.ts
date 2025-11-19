import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ReportService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async downloadSalesReport(cashBoxId: number) {
    try {
      const response = await axios.get(
        `${API_URL}/reports/sales/${cashBoxId}`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob' // Importante para archivos
        }
      );

      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-ventas-caja-${cashBoxId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error: any) {
      console.error('Error descargando reporte:', error);
      
      // Manejar error específico
      if (error.response?.status === 400) {
        throw new Error('No se puede generar reporte: La caja debe estar cerrada');
      } else if (error.response?.status === 404) {
        throw new Error('Caja no encontrada');
      } else {
        throw new Error(error.response?.data?.error || 'Error descargando reporte');
      }
    }
  }
}

export const reportService = new ReportService();