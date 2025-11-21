// src/routes/stock.routes.ts
import { Router } from "express";
import { StockMovementController } from "../controllers/stockMovement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========== MOVIMIENTOS DE STOCK ==========

// Listar todos los movimientos (con filtros opcionales)
router.get('/movements', StockMovementController.list);

// Registrar compra de stock
router.post('/purchase', StockMovementController.registerPurchase);

// Registrar envío a reparación
router.post('/repair-out', StockMovementController.registerRepairOut);

// Registrar envío a demo
router.post('/demo-out', StockMovementController.registerDemoOut);

// Registrar devolución de venta
router.post('/return', StockMovementController.registerReturn);

// Historial de cambios de precio de un producto
router.get('/price-history/:productId', StockMovementController.getPriceHistory);

// ========== PRODUCTOS ==========

// Historial de movimientos de un producto específico
router.get('/product/:productId/history', StockMovementController.getProductHistory);

// Actualizar precios de un producto
router.put('/product/:productId/prices', StockMovementController.updatePrices);

// Historial de cambios de precio de un producto
router.get('/product/:productId/price-history', StockMovementController.getPriceHistory);

// ========== RESUMEN ==========

// Obtener resumen general del inventario
router.get('/summary', StockMovementController.getInventorySummary);

// ========== REPARACIONES Y DEMOS ACTIVAS ==========

// Obtener reparaciones activas
router.get('/active-repairs', StockMovementController.getActiveRepairs);

// Obtener demos activas  
router.get('/active-demos', StockMovementController.getActiveDemos);

// Finalizar reparación
router.post('/repair/:movementId/complete', StockMovementController.completeRepair);

// Finalizar demo
router.post('/demo/:movementId/complete', StockMovementController.completeDemo);

export default router;