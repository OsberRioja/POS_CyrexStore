"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchById = exports.getPendingSales = exports.addPayment = exports.getSales = exports.getByBox = exports.getById = exports.list = exports.create = void 0;
const sale_service_1 = require("../services/sale.service");
const sale_dto_1 = require("../dtos/sale.dto");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Todo como funciones exportadas individualmente
const create = async (req, res) => {
    try {
        const dto = req.body;
        const userId = req.userId ?? req.user?.sub;
        if (!userId)
            return res.status(401).json({ error: "Usuario no autenticado" });
        // Obtener branchId del usuario autenticado
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
        const created = await sale_service_1.SaleService.createSale(dto, String(userId), targetBranchId);
        return res.status(201).json(created);
    }
    catch (err) {
        console.error("POST /sales:", err);
        return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
};
exports.create = create;
const list = async (req, res) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const sellerId = typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;
        const cashBoxId = req.query.cashBoxId ? Number(req.query.cashBoxId) : undefined;
        const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined;
        const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : undefined;
        const paymentStatus = req.query.paymentStatus ? req.query.paymentStatus : undefined;
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        // Obtener branchId del usuario autenticado
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
        const result = await sale_service_1.SaleService.list({
            page,
            limit,
            sellerId,
            cashBoxId,
            dateFrom,
            dateTo,
            paymentStatus,
            search,
            branchId: targetBranchId
        });
        return res.json(result);
    }
    catch (err) {
        console.error("GET /sales:", err);
        return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
};
exports.list = list;
const getById = async (req, res) => {
    try {
        const id = req.params.id;
        // Obtener branchId del usuario autenticado
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
        const sale = await prisma.sale.findFirst({
            where: {
                id: id,
                branchId: targetBranchId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                salePrice: true
                            }
                        }
                    }
                },
                payments: {
                    include: {
                        paymentMethod: {
                            select: {
                                name: true,
                                isCash: true
                            }
                        }
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        userCode: true
                    }
                },
                client: true,
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!sale) {
            console.log(`❌ [GET BY ID] Venta ${id} no encontrada en sucursal ${targetBranchId}`);
            return res.status(404).json({ error: "Venta no encontrada" });
        }
        const createdByUser = sale.createdBy
            ? await prisma.user.findUnique({ where: { id: sale.createdBy }, select: { id: true, name: true, userCode: true } })
            : null;
        console.log(`✅ [GET BY ID] Venta encontrada: ${id}`);
        return res.json({ ...sale, createdBy: createdByUser });
    }
    catch (err) {
        console.error("❌ [GET BY ID] Error:", err);
        return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
};
exports.getById = getById;
const getByBox = async (req, res) => {
    try {
        // aceptar tanto query como params por robustez
        const boxId = Number(req.query.boxId);
        if (!boxId)
            return res.status(400).json({ error: "boxId query required" });
        const list = await sale_service_1.SaleService.findByBox(boxId);
        return res.json(list);
    }
    catch (err) {
        console.error("GET /sales/by-box:", err);
        return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
};
exports.getByBox = getByBox;
const getSales = async (req, res) => {
    try {
        const { page, limit, sellerId, cashBoxId, dateFrom, dateTo, paymentStatus } = req.query;
        const params = {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            sellerId: sellerId,
            cashBoxId: cashBoxId ? parseInt(cashBoxId) : undefined,
            dateFrom: dateFrom,
            dateTo: dateTo,
            paymentStatus: paymentStatus ? paymentStatus : undefined
        };
        const result = await sale_service_1.SaleService.list(params);
        res.status(200).json({
            success: true,
            ...result
        });
    }
    catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Error interno del servidor';
        res.status(status).json({
            success: false,
            message
        });
    }
};
exports.getSales = getSales;
/**
 * NUEVO: Completar pago de una venta pendiente
 */
const addPayment = async (req, res) => {
    try {
        const saleId = req.params.saleId;
        const userId = req.userId ?? req.user?.sub;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const validatedData = sale_dto_1.addPaymentSchema.parse({
            saleId,
            ...req.body
        });
        const result = await sale_service_1.SaleService.addPayment(validatedData, String(userId));
        res.status(200).json({
            success: true,
            message: 'Pago agregado exitosamente',
            data: result
        });
    }
    catch (error) {
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
exports.addPayment = addPayment;
/**
 * Obtener ventas con saldo pendiente
 */
const getPendingSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const result = await sale_service_1.SaleService.findPendingSales({ page, limit });
        res.status(200).json({
            success: true,
            ...result
        });
    }
    catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Error interno del servidor';
        res.status(status).json({
            success: false,
            message
        });
    }
};
exports.getPendingSales = getPendingSales;
const searchById = async (req, res) => {
    try {
        const saleId = req.params.id;
        console.log(`🔍 Buscando venta ID: ${saleId}`);
        if (!saleId || typeof saleId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID de venta inválido'
            });
        }
        // Obtener branchId del usuario autenticado
        const userBranchId = req.user?.branchId;
        let targetBranchId = userBranchId;
        // Si es admin global (branchId = null), buscar branchId alternativo
        if (!targetBranchId) {
            // Para GET: buscar en query params
            targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
            if (!targetBranchId) {
                return res.status(400).json({
                    success: false,
                    error: "Para usuarios administradores, debe especificar una sucursal"
                });
            }
        }
        // Buscar la venta con filtro de sucursal
        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                branchId: targetBranchId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                salePrice: true
                            }
                        }
                    }
                },
                payments: {
                    include: {
                        paymentMethod: {
                            select: {
                                name: true,
                                isCash: true
                            }
                        }
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        userCode: true
                    }
                },
                client: true,
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }
        return res.json({
            success: true,
            data: sale
        });
    }
    catch (err) {
        console.error("GET /sales/search/:id:", err);
        return res.status(err?.status || 500).json({
            success: false,
            error: err?.message || "Error interno"
        });
    }
};
exports.searchById = searchById;
