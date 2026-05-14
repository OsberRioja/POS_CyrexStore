import { Request, Response } from "express";
import { SystemAlertService } from "../services/systemAlert.service";

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true" || value === true || value === "1") return true;
  if (value === "false" || value === false || value === "0") return false;
  return undefined;
}

export const SystemAlertController = {
  async list(req: Request, res: Response) {
    try {
      const result = await SystemAlertService.list({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        unreadOnly: parseBoolean(req.query.unreadOnly ?? req.query.unread),
        type: typeof req.query.type === "string" ? req.query.type : undefined,
        branchId: req.query.branchId ? Number(req.query.branchId) : undefined,
      });

      return res.json(result);
    } catch (err: any) {
      console.error("GET /system-alerts", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const alertId = Number(req.params.id);
      const result = await SystemAlertService.markAsRead(alertId);
      return res.json(result);
    } catch (err: any) {
      console.error("PATCH /system-alerts/:id/read", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const alertId = Number(req.params.id);
      await SystemAlertService.delete(alertId);
      return res.status(204).send();
    } catch (err: any) {
      console.error("DELETE /system-alerts/:id", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },
};
