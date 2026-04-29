"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const password_controller_1 = require("../controllers/password.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const passwordReset_controller_1 = require("../controllers/passwordReset.controller");
const authFlow_test_1 = require("../tests/authFlow.test");
const router = (0, express_1.Router)();
// POST /api/auth/login - ESTO es lo único que necesitas
router.post("/login", auth_controller_1.AuthController.login);
router.post("/verify-token", auth_controller_1.AuthController.verifyToken);
//Recuperacion de contraseñas
router.post('/forgot-password', passwordReset_controller_1.PasswordResetController.requestReset);
router.post('/validate-reset-token', passwordReset_controller_1.PasswordResetController.validateToken);
router.post('/reset-password', passwordReset_controller_1.PasswordResetController.resetPassword);
router.post('/change-password', auth_middleware_1.authMiddleware, password_controller_1.PasswordController.changePassword);
// Endpoint para ejecutar pruebas (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    router.post('/run-tests', async (req, res) => {
        try {
            await authFlow_test_1.AuthFlowTests.runAllTests();
            res.json({ message: 'Pruebas ejecutadas correctamente' });
        }
        catch (error) {
            res.status(500).json({ message: 'Error en las pruebas', error });
        }
    });
}
exports.default = router;
