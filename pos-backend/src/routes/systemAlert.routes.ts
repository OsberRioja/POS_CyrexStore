import { Router } from "express";
import { SystemAlertController } from "../controllers/systemAlert.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, requireRole("ADMIN"), SystemAlertController.list);
router.patch("/:id/read", authMiddleware, requireRole("ADMIN"), SystemAlertController.markAsRead);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), SystemAlertController.delete);

export default router;
