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

  async downloadExpensesReport(cashBoxId: number) {
    try {
      const response = await axios.get(
        `${API_URL}/reports/expenses/${cashBoxId}`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob'
        }
      );
    
      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener el nombre del archivo del header o usar uno por defecto
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `reporte-gastos-caja-${cashBoxId}.xlsx`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(url);
    
      return true;
    } catch (error: any) {
      console.error('Error descargando reporte de gastos:', error);
      
      // Manejar errores específicos
      if (error.response?.status === 400) {
        throw new Error('No se puede generar reporte: ' + (error.response.data.error || 'La caja debe estar cerrada'));
      } else if (error.response?.status === 404) {
        throw new Error('Caja no encontrada');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor al generar el reporte');
      } else {
        throw new Error(error.response?.data?.error || 'Error descargando reporte de gastos');
      }
    }
  }

  async downloadPaymentMethodsReport(cashBoxId: number) {
    try {
      const response = await axios.get(
        `${API_URL}/reports/payment-methods/${cashBoxId}`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob'
        }
      );

      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Obtener el nombre del archivo del header o usar uno por defecto
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `reporte-metodos-pago-caja-${cashBoxId}.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error: any) {
      console.error('Error descargando reporte de métodos de pago:', error);

      // Manejar errores específicos
      if (error.response?.status === 400) {
        throw new Error('No se puede generar reporte: ' + (error.response.data.error || 'La caja debe estar cerrada'));
      } else if (error.response?.status === 404) {
        throw new Error('Caja no encontrada');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor al generar el reporte');
      } else {
        throw new Error(error.response?.data?.error || 'Error descargando reporte de métodos de pago');
      }
    }
  }

  async downloadDailyReport(cashBoxId: number) {
    try {
      const response = await axios.get(
        `${API_URL}/reports/daily/${cashBoxId}`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob'
        }
      );
    
      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener el nombre del archivo del header o usar uno por defecto
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `reporte-diario-caja-${cashBoxId}.xlsx`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(url);
    
      return true;
    } catch (error: any) {
      console.error('Error descargando reporte diario:', error);
      
      // Manejar errores específicos
      if (error.response?.status === 400) {
        throw new Error('No se puede generar reporte: ' + (error.response.data.error || 'La caja debe estar cerrada'));
      } else if (error.response?.status === 404) {
        throw new Error('Caja no encontrada');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor al generar el reporte');
      } else {
        throw new Error(error.response?.data?.error || 'Error descargando reporte diario');
      }
    }
  }

  // Reporte mensual de ventas
  async downloadMonthlySalesReport(year: number, month: number, branchId?: number) {
    try {
      let url = `${API_URL}/reports/monthly-sales/${year}/${month}`;
      if (branchId) {
        url += `?branchId=${branchId}`;
      }

      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });

      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[month - 1];
      const fileName = `reporte-ventas-${monthName.toLowerCase()}-${year}.xlsx`;

      // Crear URL para descarga
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(urlBlob);

      return true;
    } catch (error: any) {
      console.error('Error descargando reporte mensual:', error);
      throw new Error(error.response?.data?.error || 'Error descargando reporte mensual');
    }
  }

  // Reporte de ventas por período
  async downloadPeriodSalesReport(startDate: string, endDate: string, branchId?: number, sellerId?: string, paymentMethodId?: number) {
    try {
      const params: any = {
        startDate,
        endDate
      };

      if (branchId) params.branchId = branchId;
      if (sellerId) params.sellerId = sellerId;
      if (paymentMethodId) params.paymentMethodId = paymentMethodId;

      const response = await axios.get(`${API_URL}/reports/period-sales`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
        params
      });

      const startStr = startDate.split('T')[0];
      const endStr = endDate.split('T')[0];
      const fileName = `reporte-ventas-${startStr}-al-${endStr}.xlsx`;

      // Crear URL para descarga
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(urlBlob);

      return true;
    } catch (error: any) {
      console.error('Error descargando reporte por período:', error);
      throw new Error(error.response?.data?.error || 'Error descargando reporte por período');
    }
  }

  // Reporte de gastos por período
  async downloadPeriodExpensesReport(startDate: string, endDate: string, branchId?: number, paymentMethodId?: number) {
    try {
      const params: any = {
        startDate,
        endDate
      };

      if (branchId) params.branchId = branchId;
      if (paymentMethodId) params.paymentMethodId = paymentMethodId;

      const response = await axios.get(`${API_URL}/reports/period-expenses`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
        params
      });

      const startStr = startDate.split('T')[0];
      const endStr = endDate.split('T')[0];
      const fileName = `reporte-gastos-${startStr}-al-${endStr}.xlsx`;

      // Crear URL para descarga
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(urlBlob);

      return true;
    } catch (error: any) {
      console.error('Error descargando reporte de gastos por período:', error);
      throw new Error(error.response?.data?.error || 'Error descargando reporte de gastos por período');
    }
  }

  // Reporte combinado
  async downloadCombinedReport(startDate: string, endDate: string, branchId?: number) {
    try {
      const params: any = {
        startDate,
        endDate
      };

      if (branchId) params.branchId = branchId;

      const response = await axios.get(`${API_URL}/reports/combined-report`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
        params
      });

      const startStr = startDate.split('T')[0];
      const endStr = endDate.split('T')[0];
      const fileName = `reporte-combinado-${startStr}-al-${endStr}.xlsx`;

      // Crear URL para descarga
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(urlBlob);

      return true;
    } catch (error: any) {
      console.error('Error descargando reporte combinado:', error);
      throw new Error(error.response?.data?.error || 'Error descargando reporte combinado');
    }
  }
}

export const reportService = new ReportService();