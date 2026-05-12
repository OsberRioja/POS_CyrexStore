import { Request, Response } from "express";
import { PromotionService } from "../services/promotion.service";

export const PromotionController = {
  async list(_req: Request, res: Response) { try { res.json(await PromotionService.list()); } catch (e:any) { res.status(e?.status||500).json({error:e?.message||'Error interno'}); } },
  async get(req: Request, res: Response) { try { const item = await PromotionService.get(req.params.id); if (!item) return res.status(404).json({error:'No encontrada'}); res.json(item); } catch (e:any) { res.status(e?.status||500).json({error:e?.message||'Error interno'}); } },
  async create(req: Request, res: Response) { try { res.status(201).json(await PromotionService.create(req.body)); } catch (e:any) { res.status(e?.status||500).json({error:e?.message||'Error interno'}); } },
  async update(req: Request, res: Response) { try { res.json(await PromotionService.update(req.params.id, req.body)); } catch (e:any) { res.status(e?.status||500).json({error:e?.message||'Error interno'}); } },
  async remove(req: Request, res: Response) { try { await PromotionService.remove(req.params.id); res.json({ok:true}); } catch (e:any) { res.status(e?.status||500).json({error:e?.message||'Error interno'}); } }
};
