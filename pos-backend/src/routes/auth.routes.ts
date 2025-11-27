import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { PasswordController } from "../controllers/password.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { PasswordResetController } from "../controllers/passwordReset.controller";

const router = Router();

// POST /api/auth/login - ESTO es lo único que necesitas
router.post("/login", AuthController.login);
router.post("/verify-token", AuthController.verifyToken);
//Recuperacion de contraseñas
router.post('/forgot-password', PasswordResetController.requestReset);
router.post('/validate-reset-token', PasswordResetController.validateToken);
router.post('/reset-password', PasswordResetController.resetPassword);

router.post('/change-password', authMiddleware, PasswordController.changePassword);
export default router;