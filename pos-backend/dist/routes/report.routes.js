"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authMiddleware);
// Reportes por caja (existentes)
router.get('/sales/:cashBoxId', report_controller_1.reportController.downloadSalesReport);
router.get('/expenses/:cashBoxId', report_controller_1.reportController.downloadExpensesReport);
router.get('/payment-methods/:cashBoxId', report_controller_1.reportController.downloadPaymentMethodsReport);
router.get('/daily/:cashBoxId', report_controller_1.reportController.downloadDailyReport);
// Nuevos endpoints para reportes por período
router.get('/sellers', report_controller_1.reportController.getAvailableSellers);
router.get('/monthly-sales/:year/:month', report_controller_1.reportController.downloadMonthlySalesReport);
router.get('/period-sales', report_controller_1.reportController.downloadPeriodSalesReport);
router.get('/period-sales-preview', report_controller_1.reportController.getPeriodSalesPreview);
router.get('/period-expenses', report_controller_1.reportController.downloadPeriodExpensesReport);
router.get('/period-expenses-preview', report_controller_1.reportController.getPeriodExpensesPreview);
router.get('/combined-report', report_controller_1.reportController.downloadCombinedReport);
router.get('/combined-preview', report_controller_1.reportController.getCombinedPreview);
exports.default = router;
