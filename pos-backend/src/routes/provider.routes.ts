import { Router } from "express";
import { ProviderController } from "../controllers/provider.controller";
import { authMiddleware, requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/permissions";

const router = Router();

router.post("/", authMiddleware, requirePermission(Permission.PROVIDER_CREATE), ProviderController.create);
router.get("/", authMiddleware, requirePermission(Permission.PROVIDER_READ), ProviderController.list);
router.get("/:id", authMiddleware, requirePermission(Permission.PROVIDER_READ), ProviderController.getById);
router.put("/:id", authMiddleware, requirePermission(Permission.PROVIDER_UPDATE), ProviderController.update);
router.delete("/:id", authMiddleware, requirePermission(Permission.PROVIDER_DELETE), ProviderController.remove);

export default router;
