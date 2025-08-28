import { Request, Response } from "express";
import { ProviderService } from "../services/provider.service";

export const ProviderController = {
  async create(req: Request, res: Response) {
    try {
      const dto = req.body;
      const created = await ProviderService.createProveedor(dto);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const list = await ProviderService.listProveedores();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: "Error interno" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });
      const p = await ProviderService.getProveedorById(id);
      res.json(p);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const dto = req.body;
      const updated = await ProviderService.updateProveedor(id, dto);
      res.json(updated);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await ProviderService.deleteProveedor(id);
      res.json({ message: "Proveedor eliminado", deleted });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },
};
