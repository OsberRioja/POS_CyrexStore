import { Request, Response } from 'express';
import { reportService } from '../services/report.service';

export const reportController = {
  async getAvailableSellers(req: Request, res: Response) {
    try {
      const { branchId } = req.query;
      const sellers = await reportService.getAvailableSellers(
        branchId ? parseInt(branchId as string) : undefined
      );

      return res.json(sellers);
    } catch (error: any) {
      console.error('Error obteniendo vendedores para reportes:', error);
      return res.status(error.status || 500).json({
        error: error.message || 'Error interno del servidor'
      });
    }
  },

  async downloadSalesReport(req: Request, res: Response) {
    try {
      const { cashBoxId } = req.params;
      
      if (!cashBoxId) {
        return res.status(400).json({ error: 'ID de caja requerido' });
      }

      const buffer = await reportService.generateSalesReport(Number(cashBoxId));

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-caja-${cashBoxId}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte de ventas:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadExpensesReport(req: Request, res: Response) {
    try {
      const { cashBoxId } = req.params;

      if (!cashBoxId) {
        return res.status(400).json({ error: 'ID de caja requerido' });
      }

      const buffer = await reportService.generateExpensesReport(Number(cashBoxId));
    
      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-gastos-caja-${cashBoxId}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);
    
      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte de gastos:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadPaymentMethodsReport(req: Request, res: Response) {
    try {
      const { cashBoxId } = req.params;

      if (!cashBoxId) {
        return res.status(400).json({ error: 'ID de caja requerido' });
      }

      const buffer = await reportService.generatePaymentMethodsReport(Number(cashBoxId));

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-metodos-pago-caja-${cashBoxId}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);
    
      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte de métodos de pago:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadDailyReport(req: Request, res: Response) {
    try {
      const { cashBoxId } = req.params;

      if (!cashBoxId) {
        return res.status(400).json({ error: 'ID de caja requerido' });
      }

      const buffer = await reportService.generateDailyReport(Number(cashBoxId));

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-diario-caja-${cashBoxId}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte diario:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadMonthlySalesReport(req: Request, res: Response) {
    try {
      const { year, month } = req.params;
      const { branchId } = req.query;

      const filters = {
        year: parseInt(year),
        month: parseInt(month),
        branchId: branchId ? parseInt(branchId as string) : undefined
      };

      const buffer = await reportService.generateMonthlySalesReport(filters);

      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[filters.month - 1];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-${monthName.toLowerCase()}-${year}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte mensual:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadPeriodSalesReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchId, sellerId, sellerIds, paymentMethodId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
      }

      const parsedSellerIds = typeof sellerIds === 'string'
        ? sellerIds.split(',').map(id => id.trim()).filter(Boolean)
        : undefined;

      const filters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        branchId: branchId ? parseInt(branchId as string) : undefined,
        sellerId: sellerId as string,
        sellerIds: parsedSellerIds,
        paymentMethodId: paymentMethodId ? parseInt(paymentMethodId as string) : undefined,
        reportType: 'sales' as const
      };

      const buffer = await reportService.generatePeriodSalesReport(filters);

      const startStr = filters.startDate.toISOString().split('T')[0];
      const endStr = filters.endDate.toISOString().split('T')[0];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-${startStr}-al-${endStr}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte por período:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadPeriodExpensesReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchId, paymentMethodId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
      }

      const filters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        branchId: branchId ? parseInt(branchId as string) : undefined,
        paymentMethodId: paymentMethodId ? parseInt(paymentMethodId as string) : undefined,
        reportType: 'expenses' as const
      };

      const buffer = await reportService.generatePeriodExpensesReport(filters);

      const startStr = filters.startDate.toISOString().split('T')[0];
      const endStr = filters.endDate.toISOString().split('T')[0];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-gastos-${startStr}-al-${endStr}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte de gastos por período:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  },

  async downloadCombinedReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
      }

      // Generar ambos reportes y combinarlos
      const salesFilters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        branchId: branchId ? parseInt(branchId as string) : undefined,
        reportType: 'sales' as const
      };

      const expensesFilters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        branchId: branchId ? parseInt(branchId as string) : undefined,
        reportType: 'expenses' as const
      };

      // Aquí se podría implementar la combinación de ambos reportes
      // Por ahora, generaremos solo el de ventas
      const buffer = await reportService.generatePeriodSalesReport(salesFilters);

      const startStr = salesFilters.startDate.toISOString().split('T')[0];
      const endStr = salesFilters.endDate.toISOString().split('T')[0];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-combinado-${startStr}-al-${endStr}.xlsx"`);
      res.setHeader('Content-Length', buffer.byteLength);

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando reporte combinado:', error);
      return res.status(error.status || 500).json({ 
        error: error.message || 'Error interno del servidor' 
      });
    }
  }
};  
