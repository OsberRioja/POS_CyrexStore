import { Request, Response } from "express";
import { CommissionService } from "../services/commission.service";
import { CommissionConfigSchema, UpdateCommissionConfigSchema } from "../dtos/commission.dto";

export const CommissionController = {
  /**
   * Obtener la configuración activa
   */
  async getActive(req: Request, res: Response) {
    try {
      const config = await CommissionService.getActive();
      res.json(config);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * Obtener todas las configuraciones
   */
  async getAll(req: Request, res: Response) {
    try {
      const configs = await CommissionService.getAll();
      res.json(configs);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * Obtener una configuración por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const config = await CommissionService.getById(id);
      res.json(config);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * Crear una nueva configuración
   */
  async create(req: Request, res: Response) {
    try {
      // Validar el cuerpo de la solicitud
      const validatedData = CommissionConfigSchema.parse(req.body);
      const config = await CommissionService.create(validatedData, req.userId!);
      res.status(201).json(config);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  },

  /**
   * Actualizar una configuración
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = UpdateCommissionConfigSchema.parse(req.body);
      const config = await CommissionService.update(id, validatedData);
      res.json(config);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  },

  /**
   * Activar una configuración
   */
  async activate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const config = await CommissionService.activate(id);
      res.json(config);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * Eliminar una configuración
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CommissionService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  }
};