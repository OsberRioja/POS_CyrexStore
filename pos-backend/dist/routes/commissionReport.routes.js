"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commissionReport_controller_1 = require("../controllers/commissionReport.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authMiddleware);
// Reportes de comisiones
router.get("/by-month", commissionReport_controller_1.CommissionReportController.getCommissionsByMonth);
router.get("/summary-by-month", commissionReport_controller_1.CommissionReportController.getSummaryByMonth);
router.get("/user/:userId/report", commissionReport_controller_1.CommissionReportController.getUserCommissionsReport);
router.get("/user/:userId/by-month", commissionReport_controller_1.CommissionReportController.getCommissionsByUserAndMonth);
exports.default = router;
