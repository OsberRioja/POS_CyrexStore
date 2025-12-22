// src/routes/cashbox.routes.ts
import { Router } from "express";
import { CashBoxController } from "../controllers/cashbox.controller";
import { authMiddleware, requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/permissions";

const router = Router();

router.get("/", authMiddleware, requirePermission(Permission.CASHBOX_READ_ALL), CashBoxController.list);

router.post("/open", authMiddleware, requirePermission(Permission.CASHBOX_OPEN_CLOSE), CashBoxController.open);
router.get("/open", authMiddleware, CashBoxController.getOpen);

router.get("/:id/close-preview", authMiddleware, requirePermission(Permission.CASHBOX_READ), CashBoxController.getClosePreview);

router.post("/:id/close", authMiddleware, requirePermission(Permission.CASHBOX_OPEN_CLOSE), CashBoxController.close);
router.get("/:id", authMiddleware, requirePermission(Permission.CASHBOX_READ), CashBoxController.getById);

router.post('/:id/reopen', authMiddleware, requirePermission(Permission.CASHBOX_OPEN_CLOSE), CashBoxController.reopen);
router.post('/:id/close-reopened', authMiddleware, requirePermission(Permission.CASHBOX_OPEN_CLOSE), CashBoxController.closeReopened);

export default router;