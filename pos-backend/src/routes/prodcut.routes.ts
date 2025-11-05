import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authMiddleware, requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/permissions";
import { permission } from "process";

const router = Router();

router.post("/", authMiddleware, requirePermission(Permission.PRODUCT_CREATE), productController.create);
router.get("/", authMiddleware, requirePermission(Permission.PRODUCT_READ), productController.getAll);
router.get("/:id", authMiddleware, requirePermission(Permission.PRODUCT_READ), productController.getById);
router.put("/:id", authMiddleware, requirePermission(Permission.PRODUCT_UPDATE), productController.update);
router.delete("/:id", authMiddleware, requirePermission(Permission.PRODUCT_DELETE), productController.delete);

router.patch("/:id/deactivate", authMiddleware, requirePermission(Permission.PRODUCT_TOGGLE_ACTIVE), productController.deactivate);
router.patch("/:id/activate", authMiddleware, requirePermission(Permission.PRODUCT_TOGGLE_ACTIVE), productController.activate);

export default router;
