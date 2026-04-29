"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleEditController = void 0;
const saleEdit_service_1 = require("../services/saleEdit.service");
exports.SaleEditController = {
    async update(req, res) {
        try {
            const saleId = req.params.id;
            const dto = req.body;
            const userId = req.userId ?? req.user?.sub;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            // Obtener branchId del usuario autenticado
            const userBranchId = req.user?.branchId;
            let targetBranchId = userBranchId;
            // Si es admin global, buscar branchId en body o query
            if (!targetBranchId) {
                targetBranchId = req.body.branchId || (req.query.branchId ? Number(req.query.branchId) : undefined);
                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }
            const updatedSale = await saleEdit_service_1.SaleEditService.updateSale(saleId, dto, String(userId), targetBranchId);
            return res.json({
                success: true,
                message: "Venta actualizada correctamente",
                data: updatedSale
            });
        }
        catch (err) {
            console.error("PUT /sales/:id", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    }
};
