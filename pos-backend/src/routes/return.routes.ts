import { Router } from "express";
import { create, approve, getById, list } from "../controllers/return.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireManagerForReturns } from "../middlewares/role.middleware";

const router = Router();

// Todas las rutas requieren autenticación y ser ADMIN o SUPERVISOR
router.use(authMiddleware);
router.use(requireManagerForReturns);

router.post("/", create);
router.get("/", list);
router.get("/:id", getById);
router.post("/:id/approve", approve);

export default router;