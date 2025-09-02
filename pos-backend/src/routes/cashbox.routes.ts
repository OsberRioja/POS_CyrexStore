// src/routes/cashbox.routes.ts
import { Router } from "express";
import { CashBoxController } from "../controllers/cashbox.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/open", authMiddleware, CashBoxController.open);
router.get("/open", authMiddleware, CashBoxController.getOpen);

router.post("/:id/close", authMiddleware, CashBoxController.close);
router.get("/:id", authMiddleware, CashBoxController.getById);

export default router;