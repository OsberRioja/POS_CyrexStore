// src/routes/sale.routes.ts
import { Router } from "express";
import { SaleController } from "../controllers/sale.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/bybox", authMiddleware, SaleController.getByBox);
router.post("/", authMiddleware, SaleController.create);
router.get("/", authMiddleware, SaleController.list);
router.get("/:id", authMiddleware, SaleController.getById);

export default router;
