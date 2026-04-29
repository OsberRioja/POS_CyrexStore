"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/stock.routes.ts
const express_1 = require("express");
const stockMovement_controller_1 = require("../controllers/stockMovement.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authMiddleware);
// ========== MOVIMIENTOS DE STOCK ==========
// Listar todos los movimientos (con filtros opcionales)
router.get('/movements', stockMovement_controller_1.StockMovementController.list);
// Registrar compra de stock
router.post('/purchase', stockMovement_controller_1.StockMovementController.registerPurchase);
router.post('/purchase-batch', stockMovement_controller_1.StockMovementController.registerPurchaseBatch);
// Registrar envío a reparación
router.post('/repair-out', stockMovement_controller_1.StockMovementController.registerRepairOut);
// Registrar envío a demo
router.post('/demo-out', stockMovement_controller_1.StockMovementController.registerDemoOut);
// Registrar devolución de venta
router.post('/return', stockMovement_controller_1.StockMovementController.registerReturn);
// Historial de cambios de precio de un producto
router.get('/price-history/:productId', stockMovement_controller_1.StockMovementController.getPriceHistory);
// Registrar ajuste de stock
router.post('/adjustment', stockMovement_controller_1.StockMovementController.registerAdjustment);
// Registrar uso interno
router.post('/internal-use-out', stockMovement_controller_1.StockMovementController.registerInternalUseOut);
router.post('/transfer-between-branches', stockMovement_controller_1.StockMovementController.registerTransferBetweenBranches);
// Obtener usos internos activos
router.get('/active-internal-uses', stockMovement_controller_1.StockMovementController.getActiveInternalUses);
// Retornar producto de uso interno
router.post('/internal-use/:movementId/return', stockMovement_controller_1.StockMovementController.returnInternalUse);
// ========== PRODUCTOS ==========
// Historial de movimientos de un producto específico
router.get('/product/:productId/history', stockMovement_controller_1.StockMovementController.getProductHistory);
router.get('/product/:productId/available-serials', stockMovement_controller_1.StockMovementController.getAvailableSerials);
// Actualizar precios de un producto
router.put('/product/:productId/prices', stockMovement_controller_1.StockMovementController.updatePrices);
// Historial de cambios de precio de un producto
router.get('/product/:productId/price-history', stockMovement_controller_1.StockMovementController.getPriceHistory);
// ========== RESUMEN ==========
// Obtener resumen general del inventario
router.get('/summary', stockMovement_controller_1.StockMovementController.getInventorySummary);
// ========== REPARACIONES Y DEMOS ACTIVAS ==========
// Obtener reparaciones activas
router.get('/active-repairs', stockMovement_controller_1.StockMovementController.getActiveRepairs);
// Obtener demos activas  
router.get('/active-demos', stockMovement_controller_1.StockMovementController.getActiveDemos);
// Finalizar reparación
router.post('/repair/:movementId/complete', stockMovement_controller_1.StockMovementController.completeRepair);
// Finalizar demo
router.post('/demo/:movementId/complete', stockMovement_controller_1.StockMovementController.completeDemo);
exports.default = router;
