import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware, requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/permissions";

const router = Router();

router.post("/", authMiddleware, requirePermission(Permission.USER_CREATE), UserController.create);
router.get("/", authMiddleware, requirePermission(Permission.USER_READ), UserController.list);
router.get("/:id", authMiddleware, requirePermission(Permission.USER_READ), UserController.getOne);
router.get("/code/:usercode", authMiddleware, requirePermission(Permission.USER_READ), UserController.getByUserCode);
router.get("/email/:email", authMiddleware, requirePermission(Permission.USER_READ), UserController.getByEmail);
router.get("/name/:name", authMiddleware, requirePermission(Permission.USER_READ), UserController.getByName);
router.put("/:id", authMiddleware, requirePermission(Permission.USER_UPDATE), UserController.updateUser);
router.delete("/:id", authMiddleware, requirePermission(Permission.USER_DELETE), UserController.deleteUser);

export default router;