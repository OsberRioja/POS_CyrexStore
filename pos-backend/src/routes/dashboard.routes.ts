import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Ruta para dashboard por sucursal
router.get("/branch", authMiddleware, dashboardController.getBranchDashboard);

// Ruta para dashboard general (admin)
router.get("/general", authMiddleware, dashboardController.getGeneralDashboard);

export default router;