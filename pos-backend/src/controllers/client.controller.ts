// src/controllers/cliente.controller.ts
import { Request, Response } from "express";
import { ClienteService } from "../services/client.service";

export const ClienteController = {
  async create(req: Request, res: Response) {
    try {
      const dto = req.body;
      const created = await ClienteService.createCliente(dto);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const q = typeof req.query.q === "string" ? (req.query.q as string) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await ClienteService.searchClients(q, page, limit);
      // Devolver formato consistente: { data, total, page, limit }
      return res.json({
        data: result.data,
        total: result.total,
        page,
        limit,
      });
    } catch (err: any) {
      console.error("Error GET /api/clients:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },


  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const c = await ClienteService.getClienteById(id);
      res.json(c);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const dto = req.body;
      const updated = await ClienteService.updateCliente(id, dto);
      res.json(updated);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await ClienteService.deleteCliente(id);
      res.json({ message: "Cliente eliminado", deleted });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

};
