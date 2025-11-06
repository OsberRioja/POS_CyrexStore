// src/routes/sale.routes.ts
import { Router } from "express";
import { authMiddleware, requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/permissions";
import * as SaleController from '../controllers/sale.controller';

const router = Router();

router.get('/debug', authMiddleware, SaleController.debugSales);
router.get('/pending', authMiddleware, requirePermission(Permission.SALE_READ), SaleController.getPendingSales);
router.get('/bybox', authMiddleware, SaleController.getByBox);

// Rutas con parámetros después
router.post('/:saleId/payments', authMiddleware, requirePermission(Permission.SALE_CREATE), SaleController.addPayment);
router.get('/:id', authMiddleware, requirePermission(Permission.SALE_READ), SaleController.getById);

// Rutas generales al final
router.post('/', authMiddleware, requirePermission(Permission.SALE_CREATE), SaleController.create);
router.get('/', authMiddleware, requirePermission(Permission.SALE_READ), SaleController.list);


export default router;