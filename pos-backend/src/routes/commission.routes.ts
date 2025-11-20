import { Router } from "express";
import { CommissionController } from "../controllers/commission.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo ADMIN puede gestionar configuraciones de comisiones
router.get("/active", CommissionController.getActive);
router.get("/", CommissionController.getAll);
router.get("/:id", CommissionController.getById);
router.post("/", CommissionController.create);
router.put("/:id", CommissionController.update);
router.patch("/:id/activate", CommissionController.activate);
router.delete("/:id", CommissionController.delete);

export default router;