import { Request, Response } from "express";
import { ExpenseService } from "../services/expense.service";
import type { CreateExpenseDTO } from "../dtos/expense.dto";

export const ExpenseController = {
  async create(req: Request, res: Response) {
    try {
      const dto = req.body as CreateExpenseDTO;
      const userId = (req as any).userId ?? (req as any).user?.sub;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      // Obtener branchId del usuario autenticado
      const userBranchId = (req as any).user?.branchId;
      if (!userBranchId) {
        return res.status(403).json({ error: "Usuario no asignado a una sucursal" });
      }

      const created = await ExpenseService.createExpense(dto, String(userId), userBranchId);
      return res.status(201).json(created);
    } catch (err: any) {
      console.error("POST /expenses:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async listByBox(req: Request, res: Response) {
    try {
      const boxId = Number(req.query.boxId);
      if (!boxId) return res.status(400).json({ error: "boxId query required" });
      const list = await ExpenseService.listByBox(boxId);
      return res.json(list);
    } catch (err: any) {
      console.error("GET /expenses?boxId=:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async listAll(req: Request, res: Response) {
    try {
      const userBranchId = (req as any).user?.branchId;
      const list = await ExpenseService.listAll(userBranchId);
      return res.json(list);
    } catch (err: any) {
      console.error("GET /expenses:", err);
      return res.status(500).json({ error: "Error interno" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const e = await ExpenseService.getById(id);
      return res.json(e);
    } catch (err: any) {
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },
};
