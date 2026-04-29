"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordController = void 0;
const password_service_1 = require("../services/password.service");
exports.PasswordController = {
    async changePassword(req, res) {
        try {
            const { newPassword } = req.body;
            const userId = req.user?.sub; // Asumiendo que el middleware de autenticación agrega el usuario
            if (!userId) {
                return res.status(401).json({ message: "Usuario no autenticado" });
            }
            if (!newPassword) {
                return res.status(400).json({ message: "La nueva contraseña es requerida" });
            }
            const result = await password_service_1.PasswordService.changePassword(userId, newPassword);
            return res.json({ message: "Contraseña cambiada exitosamente", ...result });
        }
        catch (err) {
            const status = err?.status || 500;
            return res.status(status).json({
                message: err?.message || "Error interno del servidor"
            });
        }
    },
};
