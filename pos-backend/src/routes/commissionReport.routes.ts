import { Router } from "express";
import { CommissionReportController } from "../controllers/commissionReport.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Reportes de comisiones
router.get("/by-month", CommissionReportController.getCommissionsByMonth);
router.get("/summary-by-month", CommissionReportController.getSummaryByMonth);
router.get("/user/:userId/report", CommissionReportController.getUserCommissionsReport);
router.get("/user/:userId/by-month", CommissionReportController.getCommissionsByUserAndMonth);

export default router;