// src/controllers/sale.controller.ts
import { Request, Response } from "express";
import { PaymentStatus } from '@prisma/client';
import { SaleService } from "../services/sale.service";
import type { CreateSaleDTO, AddPaymentDTO } from "../dtos/sale.dto";
import { addPaymentSchema } from '../dtos/sale.dto';
import { SaleRepository } from "../repositories/sale.repository";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Opción 1: Todo como funciones exportadas individualmente (RECOMENDADO)
export const create = async (req: Request, res: Response) => {
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
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const sellerId = typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;
    const cashBoxId = req.query.cashBoxId ? Number(req.query.cashBoxId) : undefined;
    const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined;
    const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : undefined;
    const paymentStatus = req.query.paymentStatus ? req.query.paymentStatus as PaymentStatus : undefined;

    const result = await SaleService.list({ 
      page, 
      limit, 
      sellerId, 
      cashBoxId, 
      dateFrom, 
      dateTo,
      paymentStatus 
    });
    return res.json(result);
  } catch (err: any) {
    console.error("GET /sales:", err);
    return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const sale = await SaleService.getById(id);
    return res.json(sale);
  } catch (err: any) {
    return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
  }
};

export const getByBox = async (req: Request, res: Response) => {
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
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      sellerId,
      cashBoxId,
      dateFrom,
      dateTo,
      paymentStatus
    } = req.query;

    const params = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sellerId: sellerId as string,
      cashBoxId: cashBoxId ? parseInt(cashBoxId as string) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      paymentStatus: paymentStatus ? paymentStatus as PaymentStatus : undefined
    };

    const result = await SaleService.list(params);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    
    res.status(status).json({
      success: false,
      message
    });
  }
};

/**
 * NUEVO: Completar pago de una venta pendiente
 */
export const addPayment = async (req: Request, res: Response) => {
  try {
    const saleId = req.params.saleId;
    const userId = (req as any).userId ?? (req as any).user?.sub;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    const validatedData = addPaymentSchema.parse({
      saleId,
      ...req.body
    });
    
    const result = await SaleService.addPayment(validatedData, String(userId));
    
    res.status(200).json({
      success: true,
      message: 'Pago agregado exitosamente',
      data: result
    });
  } catch (error: any) {
    if (error.issues) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.issues
      });
    }
    
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    
    res.status(status).json({
      success: false,
      message
    });
  }
};

/**
 * NUEVO: Obtener ventas con saldo pendiente
 */
export const getPendingSales = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await SaleService.findPendingSales({ page, limit });
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    
    res.status(status).json({
      success: false,
      message
    });
  }
};

// Agregar temporalmente en tu sale.controller.ts

export const debugSales = async (req: Request, res: Response) => {
  console.log('=== DEBUG SALES ENDPOINT ===');
  
  try {
    // 1. Verificar conexión directa a base de datos
    const directQuery = await prisma.$queryRaw`
      SELECT id, total, "totalPaid", balance, "paymentStatus", "createdAt" 
      FROM "sales" 
      ORDER BY "createdAt" DESC 
      LIMIT 3
    `;
    console.log('Direct DB query result:', directQuery);
    
    // 2. Probar el repository directamente
    console.log('Testing SaleRepository.findAll...');
    const repoResult = await SaleRepository.findAll({ page: 1, limit: 10 });
    console.log('Repository result:', {
      total: repoResult.total,
      dataLength: repoResult.data.length,
      firstSale: repoResult.data[0] ? {
        id: repoResult.data[0].id,
        total: repoResult.data[0].total,
        paymentStatus: (repoResult.data[0] as any).paymentStatus
      } : null
    });
    
    // 3. Probar el service
    console.log('Testing SaleService.list...');
    const serviceResult = await SaleService.list({ page: 1, limit: 10 });
    console.log('Service result:', {
      total: serviceResult.total,
      dataLength: serviceResult.data?.length
    });
    
    res.json({
      directQuery,
      repository: {
        total: repoResult.total,
        count: repoResult.data.length,
        sample: repoResult.data.slice(0, 2)
      },
      service: {
        total: serviceResult.total,
        count: serviceResult.data?.length,
        sample: serviceResult.data?.slice(0, 2)
      }
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: error?.message || 'Error desconocido',
      stack: error?.stack || 'No stack available'
    });
  }
  
  console.log('=== DEBUG SALES END ===');
};