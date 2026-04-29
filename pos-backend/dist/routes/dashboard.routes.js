"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Ruta para dashboard por sucursal
router.get("/branch", auth_middleware_1.authMiddleware, dashboard_controller_1.dashboardController.getBranchDashboard);
// Ruta para dashboard general (admin)
router.get("/general", auth_middleware_1.authMiddleware, dashboard_controller_1.dashboardController.getGeneralDashboard);
exports.default = router;
