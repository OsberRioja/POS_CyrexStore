"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
exports.dashboardController = {
    // Dashboard por sucursal
    async getBranchDashboard(req, res) {
        try {
            const userId = req.userId ?? req.user?.sub ?? req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
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
            // Parámetros: período y fecha opcional
            const period = req.query.period || 'day';
            const dateParam = req.query.date;
            const date = dateParam ? new Date(dateParam) : new Date();
            // Validar período
            const validPeriods = ['day', 'week', 'month', 'year', 'all', 'historical'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                    error: `Período no válido. Debe ser uno de: ${validPeriods.join(', ')}`
                });
            }
            const dashboard = await dashboard_service_1.dashboardService.getBranchDashboard(targetBranchId, period, date);
            return res.json(dashboard);
        }
        catch (err) {
            console.error("GET /dashboard/branch error:", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    // Dashboard general (admin)
    async getGeneralDashboard(req, res) {
        try {
            const userId = req.userId ?? req.user?.sub ?? req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            // Solo administradores globales pueden acceder
            const userBranchId = req.user?.branchId;
            if (userBranchId !== null && userBranchId !== undefined) {
                return res.status(403).json({ error: "Solo administradores globales pueden acceder al dashboard general" });
            }
            // Parámetros: período y fecha opcional
            const period = req.query.period || 'day';
            const dateParam = req.query.date;
            const date = dateParam ? new Date(dateParam) : new Date();
            // Validar período
            const validPeriods = ['day', 'week', 'month', 'year', 'all', 'historical'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                    error: `Período no válido. Debe ser uno de: ${validPeriods.join(', ')}`
                });
            }
            const dashboard = await dashboard_service_1.dashboardService.getGeneralDashboard(period, date);
            return res.json(dashboard);
        }
        catch (err) {
            console.error("GET /dashboard/general error:", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    }
};
