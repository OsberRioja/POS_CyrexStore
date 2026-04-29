"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashBoxController = void 0;
const cashbox_service_1 = require("../services/cashbox.service");
exports.CashBoxController = {
    async open(req, res) {
        try {
            const dto = req.body;
            const userId = req.userId ?? req.user?.sub;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            // Obtener branchId del usuario autenticado
            const userBranchId = req.user?.branchId;
            // Para administradores usar branchId del body o params:
            let targetBranchId = userBranchId;
            if (!targetBranchId) {
                targetBranchId = dto.branchId;
                // Si no viene en body, buscar en query params (para GET) o headers
                if (!targetBranchId && req.method === 'GET') {
                    targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                }
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            // if (!userBranchId) {
            //   return res.status(403).json({ error: "Usuario no asignado a una sucursal" });
            // }
            console.log('🔍 Debug open cashbox:', {
                userBranchId: req.user?.branchId,
                bodyBranchId: dto.branchId,
                finalBranchId: targetBranchId,
                userId: req.userId
            });
            const created = await cashbox_service_1.CashBoxService.open(dto, String(userId), targetBranchId);
            return res.status(201).json(created);
        }
        catch (err) {
            console.error("POST /cashbox/open", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async getOpen(req, res) {
        try {
            // Obtener branchId del usuario autenticado
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            if (!targetBranchId) {
                // Para admin global, buscar branchId en query params
                targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal via query param: ?branchId=1"
                    });
                }
            }
            const open = await cashbox_service_1.CashBoxService.getOpen(targetBranchId);
            return res.json(open);
        }
        catch (err) {
            console.error("GET /cashbox/open", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    async close(req, res) {
        try {
            const boxId = Number(req.params.id);
            const dto = req.body;
            const userId = req.userId ?? req.user?.sub;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            const result = await cashbox_service_1.CashBoxService.close(boxId, String(userId), dto);
            return res.json(result);
        }
        catch (err) {
            console.error("POST /cashbox/:id/close", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const data = await cashbox_service_1.CashBoxService.getById(id);
            return res.json(data);
        }
        catch (err) {
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async list(req, res) {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const status = req.query.status;
            // Obtener branchId del usuario autenticado
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Si es admin global, buscar branchId en query params
            if (!targetBranchId) {
                targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal via query param: ?branchId=1"
                    });
                }
            }
            // Filtrar por sucursal del usuario
            const result = await cashbox_service_1.CashBoxService.list({ page, limit, status, branchId: targetBranchId });
            return res.json(result);
        }
        catch (err) {
            console.error("GET /cashbox", err);
            return res.status(500).json({ error: "Error interno" });
        }
    },
    async getClosePreview(req, res) {
        try {
            const boxId = Number(req.params.id);
            console.log('🔍 Getting close preview for box:', boxId);
            const preview = await cashbox_service_1.CashBoxService.getClosePreview(boxId);
            console.log('🔍 Preview calculated:', preview);
            return res.json(preview);
        }
        catch (err) {
            console.error("GET /cashbox/:id/close-preview", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async reopen(req, res) {
        try {
            const boxId = Number(req.params.id);
            const userId = req.userId ?? req.user?.sub;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            const reopened = await cashbox_service_1.CashBoxService.reopen(boxId, String(userId));
            return res.json(reopened);
        }
        catch (err) {
            console.error("POST /cashbox/:id/reopen", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async closeReopened(req, res) {
        try {
            const boxId = Number(req.params.id);
            const userId = req.userId ?? req.user?.sub;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            const closed = await cashbox_service_1.CashBoxService.closeReopened(boxId, String(userId));
            return res.json(closed);
        }
        catch (err) {
            console.error("POST /cashbox/:id/close-reopened", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
};
