import { Request, Response } from "express";
import { ReturnService } from "../services/return.service";
import { CreateReturnDTO } from "../dtos/return.dto";

export const create = async (req: Request, res: Response) => {
  try {
    const dto = CreateReturnDTO.parse(req.body);
    const userId = (req as any).userId;

    const result = await ReturnService.createReturn(dto, userId);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.issues) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(error.status || 500).json({ error: error.message || "Error interno" });
  }
};

export const approve = async (req: Request, res: Response) => {
  try {
    const returnId = Number(req.params.id);
    const userId = (req as any).userId;

    const result = await ReturnService.approveReturn(returnId, userId);
    return res.json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({ error: error.message || "Error interno" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const returnId = Number(req.params.id);
    const result = await ReturnService.getReturnById(returnId);
    return res.json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({ error: error.message || "Error interno" });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const saleId = req.query.saleId as string | undefined;

    const result = await ReturnService.listReturns({ page, limit, saleId });
    return res.json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({ error: error.message || "Error interno" });
  }
};