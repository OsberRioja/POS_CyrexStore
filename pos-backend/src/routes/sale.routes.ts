// src/routes/sale.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as SaleController from '../controllers/sale.controller';

const router = Router();

// IMPORTANTE: Las rutas más específicas deben ir ANTES que las genéricas
// Si pones '/pending' después de '/:id', Express lo interpretará como si 'pending' fuera un ID

// Rutas específicas primero
// Agregar esta línea ANTES de la ruta '/:id'
router.get('/debug', authMiddleware, SaleController.debugSales);
router.get('/pending', authMiddleware, SaleController.getPendingSales);
router.get('/bybox', authMiddleware, SaleController.getByBox);

// Rutas con parámetros después
router.post('/:saleId/payments', authMiddleware, SaleController.addPayment);
router.get('/:id', authMiddleware, SaleController.getById);

// Rutas generales al final
router.post('/', authMiddleware, SaleController.create);
router.get('/', authMiddleware, SaleController.list);


export default router;