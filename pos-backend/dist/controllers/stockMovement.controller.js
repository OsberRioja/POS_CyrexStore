"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementController = void 0;
const stockMovement_service_1 = require("../services/stockMovement.service");
const prismaClient_1 = require("../prismaClient");
const currencyConversion_service_1 = require("../services/currencyConversion.service");
exports.StockMovementController = {
    /**
     * Registrar una compra de stock
     */
    async registerPurchase(req, res) {
        try {
            const userId = req.userId;
            const { productId, quantity, unitCost, providerId, notes, serialNumbers } = req.body;
            if (!productId || !quantity || !unitCost) {
                return res.status(400).json({
                    error: "productId, quantity y unitCost son requeridos"
                });
            }
            const movement = await stockMovement_service_1.StockMovementService.registerPurchase({ productId, quantity, unitCost, providerId, notes, serialNumbers }, userId);
            return res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/purchase:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    async registerPurchaseBatch(req, res) {
        try {
            const userId = req.userId;
            const { purchases } = req.body;
            if (!Array.isArray(purchases) || purchases.length === 0) {
                return res.status(400).json({
                    error: "Debe enviar al menos un producto en la compra"
                });
            }
            const movements = await stockMovement_service_1.StockMovementService.registerPurchaseBatch({ purchases }, userId);
            return res.status(201).json({ data: movements });
        }
        catch (err) {
            console.error("POST /stock/purchase-batch:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Registrar envío a reparación
     */
    async registerRepairOut(req, res) {
        try {
            const userId = req.userId;
            const { productId, quantity, reason, notes, serialNumbers } = req.body;
            if (!productId || !quantity || !reason) {
                return res.status(400).json({
                    error: "productId, quantity y reason son requeridos"
                });
            }
            const movement = await stockMovement_service_1.StockMovementService.registerOutbound({ productId, quantity, movementType: 'REPAIR_OUT', reason, notes, serialNumbers }, userId);
            return res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/repair-out:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Registrar envío a demo
     */
    async registerDemoOut(req, res) {
        try {
            const userId = req.userId;
            const { productId, quantity, reason, notes, serialNumbers } = req.body;
            if (!productId || !quantity || !reason) {
                return res.status(400).json({
                    error: "productId, quantity y reason son requeridos"
                });
            }
            const movement = await stockMovement_service_1.StockMovementService.registerOutbound({ productId, quantity, movementType: 'DEMO_OUT', reason, notes, serialNumbers }, userId);
            return res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/demo-out:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Registrar devolución de venta
     */
    async registerReturn(req, res) {
        try {
            const userId = req.userId;
            const { saleId, items, notes } = req.body;
            if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    error: "saleId y items son requeridos"
                });
            }
            const movements = await stockMovement_service_1.StockMovementService.registerReturn({ saleId, items, notes }, userId);
            return res.status(201).json(movements);
        }
        catch (err) {
            console.error("POST /stock/return:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Listar movimientos con filtros
     */
    async list(req, res) {
        try {
            const { productId, movementType, dateFrom, dateTo, page, limit, saleId, branchId } = req.query;
            const filters = {};
            if (productId)
                filters.productId = String(productId);
            if (movementType)
                filters.movementType = movementType;
            if (dateFrom)
                filters.dateFrom = String(dateFrom);
            if (dateTo)
                filters.dateTo = String(dateTo);
            if (page)
                filters.page = Number(page);
            if (limit)
                filters.limit = Number(limit);
            if (saleId)
                filters.saleId = String(saleId);
            if (branchId)
                filters.branchId = Number(branchId);
            const result = await stockMovement_service_1.StockMovementService.list(filters);
            return res.json(result);
        }
        catch (err) {
            console.error("GET /stock/movements:", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    async getAvailableSerials(req, res) {
        try {
            const { productId } = req.params;
            const serials = await stockMovement_service_1.StockMovementService.getAvailableSerials(productId);
            return res.json({ data: serials });
        }
        catch (err) {
            console.error("GET /stock/product/:productId/available-serials:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Obtener historial de un producto específico
     */
    async getProductHistory(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Manejar admin global
            if (!targetBranchId) {
                targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            const productId = req.params.productId;
            const history = await stockMovement_service_1.StockMovementService.getProductHistory(productId, targetBranchId);
            res.json(history);
        }
        catch (err) {
            console.error("GET /stock/product/:productId/history:", err);
            res.status(500).json({ error: "Error interno" });
        }
    },
    /**
     * Actualizar precios de un producto
     */
    async updatePrices(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            const { costPrice, salePrice, notes } = req.body;
            if (!productId) {
                return res.status(400).json({ error: "productId es requerido" });
            }
            if (costPrice === undefined && salePrice === undefined) {
                return res.status(400).json({
                    error: "Debe proporcionar al menos costPrice o salePrice"
                });
            }
            const updatedProduct = await stockMovement_service_1.StockMovementService.updatePrices(productId, { costPrice, salePrice, notes }, userId);
            return res.json(updatedProduct);
        }
        catch (err) {
            console.error("PUT /stock/product/:productId/prices:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Obtener historial de cambios de precio
     */
    async getPriceHistory(req, res) {
        try {
            const { productId } = req.params;
            const history = await stockMovement_service_1.StockMovementService.getPriceHistory(productId);
            res.json(history);
        }
        catch (error) {
            console.error('❌ Controlador - Error en getPriceHistory:', error);
            res.status(error.status || 500).json({
                success: false,
                message: error.message
            });
        }
    },
    /**
     * Obtener resumen de inventario
     */
    async getInventorySummary(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            if (!targetBranchId) {
                if (req.method === 'GET') {
                    targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                }
                else {
                    targetBranchId = req.body.branchId;
                }
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            // Obtener todos los productos activos de una vez
            const allProducts = await prismaClient_1.prisma.product.findMany({
                where: targetBranchId ? {
                    branchId: targetBranchId,
                    isActive: true
                } : {
                    isActive: true
                },
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    stock: true,
                    salePrice: true,
                    costPrice: true,
                    priceCurrency: true
                }
            });
            // Filtrar productos con bajo stock (stock ≤ 5 y > 0)
            const lowStockProducts = allProducts
                .filter(p => p.stock <= 5 && p.stock > 0)
                .slice(0, 50); // Limitar para respuesta
            // Contar productos sin stock
            const outOfStockCount = allProducts.filter(p => p.stock === 0).length;
            // Calcular valor total del inventario con conversión
            let totalInventoryValue = 0;
            // Preparar datos para conversión en lote
            const productsForConversion = allProducts.map(p => ({
                id: p.id,
                costPrice: p.costPrice,
                priceCurrency: p.priceCurrency || 'BOB',
                stock: p.stock
            }));
            // Usar servicio en lote para conversión
            const conversions = await currencyConversion_service_1.CurrencyConversionService.convertProductsCostToBOB(productsForConversion);
            // Calcular valor total
            allProducts.forEach(product => {
                const key = `${product.costPrice}:${product.priceCurrency || 'BOB'}:BOB`;
                const costInBOB = conversions.get(key) || product.costPrice;
                totalInventoryValue += product.stock * costInBOB;
            });
            totalInventoryValue = parseFloat(totalInventoryValue.toFixed(2));
            return res.json({
                summary: {
                    totalProducts: allProducts.length,
                    outOfStockCount,
                    lowStockCount: lowStockProducts.length,
                    totalInventoryValue
                },
                lowStockProducts: lowStockProducts.map(p => ({
                    id: p.id,
                    sku: p.sku,
                    name: p.name,
                    stock: p.stock,
                    salePrice: p.salePrice,
                    costPrice: p.costPrice,
                    priceCurrency: p.priceCurrency
                }))
            });
        }
        catch (err) {
            console.error("GET /stock/summary:", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    /**
      * Obtener reparaciones activas
    */
    async getActiveRepairs(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Si es admin global (branchId = null), buscar branchId alternativo
            if (!targetBranchId) {
                // Para GET: buscar en query params
                if (req.method === 'GET') {
                    targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                }
                else {
                    targetBranchId = req.body.branchId;
                }
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            const repairs = await stockMovement_service_1.StockMovementService.getActiveRepairs(targetBranchId);
            res.json(repairs);
        }
        catch (err) {
            console.error("❌ Stack trace:", err.stack);
            return res.status(500).json({ error: "Error interno", message: err?.message, details: process.env.NODE_ENV === 'development' ? err.stack : undefined });
        }
    },
    /**
      * Obtener demos activas
    */
    async getActiveDemos(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Si es admin global (branchId = null), buscar branchId alternativo
            if (!targetBranchId) {
                // Para GET: buscar en query params
                if (req.method === 'GET') {
                    targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                }
                else {
                    targetBranchId = req.body.branchId;
                }
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            const demos = await stockMovement_service_1.StockMovementService.getActiveDemos(targetBranchId);
            res.json(demos);
        }
        catch (err) {
            console.error("GET /stock/active-demos:", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    /**
      * Finalizar reparación
    */
    async completeRepair(req, res) {
        try {
            const { movementId } = req.params;
            const { notes, resolution } = req.body;
            const userId = req.userId;
            const movement = await stockMovement_service_1.StockMovementService.completeRepair(parseInt(movementId), { notes, resolution }, userId);
            res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/complete-repair/:movementId:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
      * Finalizar demo
    */
    async completeDemo(req, res) {
        try {
            const { movementId } = req.params;
            const { notes, resolution } = req.body;
            const userId = req.userId;
            const movement = await stockMovement_service_1.StockMovementService.completeDemo(parseInt(movementId), { notes, resolution }, userId);
            res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/complete-demo/:movementId:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
   * Registrar ajuste de stock
   */
    async registerAdjustment(req, res) {
        try {
            const userId = req.userId;
            const { productId, quantity, reason, notes } = req.body;
            if (!productId || quantity === undefined || !reason) {
                return res.status(400).json({
                    error: "productId, quantity y reason son requeridos"
                });
            }
            const movement = await stockMovement_service_1.StockMovementService.registerAdjustment({ productId, quantity, reason, notes }, userId);
            return res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/adjustment:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Registrar salida por uso interno
     */
    async registerInternalUseOut(req, res) {
        try {
            const userId = req.userId;
            const { productId, quantity, reason, destination, expectedReturnDate, notes, serialNumbers } = req.body;
            if (!productId || !quantity || !reason) {
                return res.status(400).json({
                    error: "productId, quantity y reason son requeridos"
                });
            }
            const movement = await stockMovement_service_1.StockMovementService.registerInternalUseOut({
                productId,
                quantity,
                reason,
                destination,
                expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
                notes,
                serialNumbers
            }, userId);
            return res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/internal-use-out:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    async registerTransferBetweenBranches(req, res) {
        try {
            const userId = req.userId;
            const { productId, destinationBranchId, quantity, reason, notes, serialNumbers } = req.body;
            if (!productId || !destinationBranchId || !quantity || !reason) {
                return res.status(400).json({
                    error: "productId, destinationBranchId, quantity y reason son requeridos"
                });
            }
            const transfer = await stockMovement_service_1.StockMovementService.registerTransferBetweenBranches({
                productId,
                destinationBranchId: Number(destinationBranchId),
                quantity: Number(quantity),
                reason,
                notes,
                serialNumbers
            }, userId);
            return res.status(201).json(transfer);
        }
        catch (err) {
            console.error("POST /stock/transfer-between-branches:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    },
    /**
     * Obtener usos internos activos
     */
    async getActiveInternalUses(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Si es admin global (branchId = null), buscar branchId alternativo
            if (!targetBranchId) {
                targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            const internalUses = await stockMovement_service_1.StockMovementService.getActiveInternalUses(targetBranchId);
            res.json(internalUses);
        }
        catch (err) {
            console.error("GET /stock/active-internal-uses:", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    /**
     * Retornar producto de uso interno
     */
    async returnInternalUse(req, res) {
        try {
            const { movementId } = req.params;
            const { notes, condition } = req.body;
            const userId = req.userId;
            const movement = await stockMovement_service_1.StockMovementService.returnInternalUse(parseInt(movementId), { notes, condition }, userId);
            res.status(201).json(movement);
        }
        catch (err) {
            console.error("POST /stock/internal-use/:movementId/return:", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    }
};
