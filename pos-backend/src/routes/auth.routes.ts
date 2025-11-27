import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { PasswordController } from "../controllers/password.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { PasswordResetController } from "../controllers/passwordReset.controller";
import { AuthFlowTests } from "../tests/authFlow.test";

const router = Router();

// POST /api/auth/login - ESTO es lo único que necesitas
router.post("/login", AuthController.login);
router.post("/verify-token", AuthController.verifyToken);
//Recuperacion de contraseñas
router.post('/forgot-password', PasswordResetController.requestReset);
router.post('/validate-reset-token', PasswordResetController.validateToken);
router.post('/reset-password', PasswordResetController.resetPassword);

router.post('/change-password', authMiddleware, PasswordController.changePassword);

// Endpoint para ejecutar pruebas (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.post('/run-tests', async (req, res) => {
    try {
      await AuthFlowTests.runAllTests();
      res.json({ message: 'Pruebas ejecutadas correctamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error en las pruebas', error });
    }
  });
}
export default router;