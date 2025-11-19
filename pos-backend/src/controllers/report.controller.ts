import { Request, Response } from 'express';
import { reportService } from '../services/report.service';

export const reportController = {
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
  }
};