import { Request, Response } from "express";
import { CommissionReportService } from "../services/commissionReport.service";
import { CommissionReportQuerySchema, UserCommissionReportQuerySchema } from "../dtos/commissionReport.dto";

export const CommissionReportController = {
  /**
   * Obtener comisiones por mes y año
   */
  async getCommissionsByMonth(req: Request, res: Response) {
    try {
      const validatedQuery = CommissionReportQuerySchema.parse({
        month: parseInt(req.query.month as string),
        year: parseInt(req.query.year as string),
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      const result = await CommissionReportService.getCommissionsByMonth(
        validatedQuery.month,
        validatedQuery.year,
        validatedQuery.page,
        validatedQuery.limit
      );
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  },

  /**
   * Obtener resumen de comisiones por mes y año
   */
  async getSummaryByMonth(req: Request, res: Response) {
    try {
      const validatedQuery = CommissionReportQuerySchema.parse({
        month: parseInt(req.query.month as string),
        year: parseInt(req.query.year as string),
      });

      const result = await CommissionReportService.getSummaryByMonth(
        validatedQuery.month,
        validatedQuery.year
      );
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  },

  /**
   * Obtener reporte de comisiones por usuario en un rango de fechas
   */
  async getUserCommissionsReport(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const validatedQuery = UserCommissionReportQuerySchema.parse({
        userId,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });

      const result = await CommissionReportService.getUserCommissionsReport(
        validatedQuery.userId,
        validatedQuery.startDate,
        validatedQuery.endDate
      );
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  },

  /**
   * Obtener comisiones por usuario y mes
   */
  async getCommissionsByUserAndMonth(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const validatedQuery = CommissionReportQuerySchema.parse({
        month: parseInt(req.query.month as string),
        year: parseInt(req.query.year as string),
      });

      const result = await CommissionReportService.getCommissionsByUserAndMonth(
        userId,
        validatedQuery.month,
        validatedQuery.year
      );
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  }
};