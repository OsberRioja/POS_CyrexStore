// src/controllers/paymentMethod.controller.ts
import { Request, Response } from "express";
import { PaymentMethodService } from "../services/paymentMethod.service";
import type { CreatePaymentMethodDTO, UpdatePaymentMethodDTO } from "../dtos/paymentMethod.dto";

export const PaymentMethodController = {
  async list(req: Request, res: Response) {
    try {
      const list = await PaymentMethodService.listAll();
      res.json(list);
    } catch (err: any) {
      console.error("GET /payment-methods", err);
      res.status(500).json({ error: "Error interno" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const pm = await PaymentMethodService.getById(id);
      res.json(pm);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const dto = req.body as CreatePaymentMethodDTO;
      const created = await PaymentMethodService.create(dto);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const dto = req.body as UpdatePaymentMethodDTO;
      const updated = await PaymentMethodService.update(id, dto);
      res.json(updated);
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await PaymentMethodService.remove(id);
      res.json({ message: "Eliminado", deleted });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  /** endpoint útil para forzar creación de defaults (opcional) */
  async initDefaults(_req: Request, res: Response) {
    try {
      const created = await PaymentMethodService.ensureDefaults();
      res.json({ ok: true, created });
    } catch (err: any) {
      res.status(500).json({ error: "Error inicializando métodos por defecto" });
    }
  },

  async summaryByBox(req: Request, res: Response) {
  try {
    const cashBoxId = req.query.cashBoxId ? Number(req.query.cashBoxId) : undefined;
    const data = await PaymentMethodService.summaryByCashBox(cashBoxId as number);
    return res.json(data);
    } catch (err:any) {
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  }
};
