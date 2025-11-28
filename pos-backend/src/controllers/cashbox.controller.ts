// src/controllers/cashbox.controller.ts
import { Request, Response } from "express";
import { CashBoxService } from "../services/cashbox.service";
import type { OpenCashBoxDTO, CloseCashBoxDTO } from "../dtos/cashBox.dto";

export const CashBoxController = {
  async open(req: Request, res: Response) {
    try {
      const dto = req.body as OpenCashBoxDTO;
      const userId = (req as any).userId ?? (req as any).user?.sub;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      // Obtener branchId del usuario autenticado
      const userBranchId = (req as any).user?.branchId;

      // Para administradores usar branchId del body o params:
      let targetBranchId = userBranchId;
      if (!targetBranchId) {
        targetBranchId = dto.branchId;

        // Si no viene en body, buscar en query params (para GET) o headers
        if (!targetBranchId && req.method === 'GET') {
          targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
        }

        if (!targetBranchId) {
          return res.status(400).json({ 
            error: "Para usuarios administradores, debe especificar una sucursal" 
          });
        }
      }

      // if (!userBranchId) {
      //   return res.status(403).json({ error: "Usuario no asignado a una sucursal" });
      // }
      console.log('🔍 Debug open cashbox:', {
        userBranchId: (req as any).user?.branchId,
        bodyBranchId: dto.branchId,
        finalBranchId: targetBranchId,
        userId: (req as any).userId
      });

      const created = await CashBoxService.open(dto, String(userId), targetBranchId);
      return res.status(201).json(created);
    } catch (err: any) {
      console.error("POST /cashbox/open", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async getOpen(req: Request, res: Response) {
    try {
      // Obtener branchId del usuario autenticado
      const userBranchId = (req as any).user?.branchId;
      let targetBranchId = userBranchId;
      
      if (!targetBranchId) {
        // Para admin global, buscar branchId en query params
        targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
        
        if (!targetBranchId) {
          return res.status(400).json({ 
            error: "Para usuarios administradores, debe especificar una sucursal via query param: ?branchId=1" 
          });
        }
      }

      const open = await CashBoxService.getOpen(targetBranchId);
      return res.json(open);
    } catch (err: any) {
      console.error("GET /cashbox/open", err);
      return res.status(500).json({ error: "Error interno" });
    }
  },

  async close(req: Request, res: Response) {
    try {
      const boxId = Number(req.params.id);
      const dto = req.body as CloseCashBoxDTO;
      const userId = (req as any).userId ?? (req as any).user?.sub;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const result = await CashBoxService.close(boxId, String(userId), dto);
      return res.json(result);
    } catch (err: any) {
      console.error("POST /cashbox/:id/close", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await CashBoxService.getById(id);
      return res.json(data);
    } catch (err: any) {
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const status = req.query.status as 'OPEN' | 'CLOSED' | undefined;

      // Obtener branchId del usuario autenticado
      const userBranchId = (req as any).user?.branchId;
      let targetBranchId = userBranchId;
    
      // Si es admin global, buscar branchId en query params
      if (!targetBranchId) {
        targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;

        if (!targetBranchId) {
          return res.status(400).json({ 
            error: "Para usuarios administradores, debe especificar una sucursal via query param: ?branchId=1" 
          });
        }
      }

      // Filtrar por sucursal del usuario
      const result = await CashBoxService.list({ page, limit, status, branchId: targetBranchId });
      return res.json(result);
    } catch (err: any) {
      console.error("GET /cashbox", err);
      return res.status(500).json({ error: "Error interno" });
    }
  },

  async getClosePreview(req: Request, res: Response) {
    try {
      const boxId = Number(req.params.id);
      console.log('🔍 Getting close preview for box:', boxId);
      const preview = await CashBoxService.getClosePreview(boxId);
      console.log('🔍 Preview calculated:', preview);
      return res.json(preview);
    } catch (err: any) {
      console.error("GET /cashbox/:id/close-preview", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },
};