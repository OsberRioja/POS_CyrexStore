import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { PasswordController } from "../controllers/password.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
const router = Router();

// POST /api/auth/login - ESTO es lo único que necesitas
router.post("/login", AuthController.login);

// POST /api/auth/verify-token (para validar tokens)
router.post("/verify-token", AuthController.verifyToken);

router.post('/change-password', authMiddleware, PasswordController.changePassword);
export default router;