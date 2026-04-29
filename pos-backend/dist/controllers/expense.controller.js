"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseController = void 0;
const expense_service_1 = require("../services/expense.service");
exports.ExpenseController = {
    async create(req, res) {
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
            const created = await expense_service_1.ExpenseService.createExpense(dto, String(userId), targetBranchId);
            return res.status(201).json(created);
        }
        catch (err) {
            console.error("POST /expenses:", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async listByBox(req, res) {
        try {
            const boxId = Number(req.query.boxId);
            if (!boxId)
                return res.status(400).json({ error: "boxId query required" });
            const list = await expense_service_1.ExpenseService.listByBox(boxId);
            return res.json(list);
        }
        catch (err) {
            console.error("GET /expenses?boxId=:", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async listAll(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Si es admin global (branchId = null), buscar branchId alternativo
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
            const list = await expense_service_1.ExpenseService.listAll(targetBranchId);
            return res.json(list);
        }
        catch (err) {
            console.error("GET /expenses:", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const e = await expense_service_1.ExpenseService.getById(id);
            return res.json(e);
        }
        catch (err) {
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
};
