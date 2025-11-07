import { Router } from "express";
import { ClienteController } from "../controllers/client.controller";
import { authMiddleware, requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/permissions";

const router = Router();

router.post("/", authMiddleware, requirePermission(Permission.CLIENT_CREATE), ClienteController.create);
router.get("/", authMiddleware, requirePermission(Permission.CLIENT_READ), ClienteController.list);
router.get("/:id", authMiddleware, requirePermission(Permission.CLIENT_READ), ClienteController.getById);
router.put("/:id", authMiddleware, requirePermission(Permission.CLIENT_UPDATE), ClienteController.update);
router.delete("/:id", authMiddleware, requirePermission(Permission.CLIENT_DELETE), ClienteController.remove);

export default router;
