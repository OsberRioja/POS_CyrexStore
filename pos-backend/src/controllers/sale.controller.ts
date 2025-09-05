// src/controllers/sale.controller.ts
import { Request, Response } from "express";
import { SaleService } from "../services/sale.service";
import type { CreateSaleDTO } from "../dtos/sale.dto";

export const SaleController = {
  async create(req: Request, res: Response) {
    try {
      const dto = req.body as CreateSaleDTO;
      const userId = (req as any).userId ?? (req as any).user?.sub;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const created = await SaleService.createSale(dto, String(userId));
      return res.status(201).json(created);
    } catch (err: any) {
      console.error("POST /sales:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const sellerId = typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;
      const cashBoxId = req.query.cashBoxId ? Number(req.query.cashBoxId) : undefined;
      const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined;
      const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : undefined;

      const result = await SaleService.list({ page, limit, sellerId, cashBoxId, dateFrom, dateTo });
      return res.json(result);
    } catch (err: any) {
      console.error("GET /sales:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const sale = await SaleService.getById(id);
      return res.json(sale);
    } catch (err: any) {
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async getByBox(req: Request, res: Response) {
    try {
      // aceptar tanto query como params por robustez
      const boxId = Number(req.query.boxId);
      if (!boxId) return res.status(400).json({ error: "boxId query required" });
      const list = await SaleService.findByBox(boxId);

      return res.json(list);
    } catch (err: any) {
      console.error("GET /sales/by-box:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },
};
