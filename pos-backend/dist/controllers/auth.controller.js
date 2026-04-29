"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.AuthController = {
    async login(req, res) {
        try {
            const { login, password } = req.body;
            if (!login || !password) {
                return res.status(400).json({
                    message: "Email/código de usuario y contraseña son requeridos"
                });
            }
            const result = await auth_service_1.AuthService.login(login, password);
            return res.json({
                message: "Login exitoso",
                ...result
            });
        }
        catch (err) {
            const status = err?.status || 500;
            return res.status(status).json({
                message: err?.message || "Error interno del servidor"
            });
        }
    },
    async verifyToken(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ message: "Token es requerido" });
            }
            const decoded = auth_service_1.AuthService.verifyToken(token);
            return res.json({
                valid: true,
                decoded
            });
        }
        catch (err) {
            return res.status(401).json({
                valid: false,
                message: "Token inválido"
            });
        }
    }
};
