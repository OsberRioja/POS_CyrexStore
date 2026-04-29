"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetController = void 0;
const passwordReset_service_1 = require("../services/passwordReset.service");
const email_service_1 = require("../services/email.service");
const emailTemplates_1 = require("../templates/emailTemplates");
const env_1 = require("../env");
exports.PasswordResetController = {
    async requestReset(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "El email es requerido" });
            }
            const result = await passwordReset_service_1.PasswordResetService.requestPasswordReset(email);
            // Si el usuario existe, enviar email
            if (result) {
                const emailSent = await email_service_1.emailService.sendEmail(result.user.email, "Restablecer tu contraseña - Sistema POS", emailTemplates_1.EmailTemplates.generatePasswordResetEmail({
                    userName: result.user.name,
                    resetLink: result.resetLink,
                    companyName: env_1.env.email.fromName ?? "CYREX STORE",
                }));
                if (emailSent) {
                    console.log(`📧 Email de recuperación enviado a: ${result.user.email}`);
                }
            }
            // Por seguridad, siempre devolvemos el mismo mensaje
            res.json({
                message: "Si el email existe, se ha enviado un enlace para restablecer la contraseña",
            });
        }
        catch (error) {
            console.error("Error en requestReset:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async validateToken(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ message: "Token es requerido" });
            }
            await passwordReset_service_1.PasswordResetService.validateResetToken(token);
            res.json({ valid: true, message: "Token válido" });
        }
        catch (error) {
            res.status(400).json({ valid: false, message: error.message });
        }
    },
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({
                    message: "Token y nueva contraseña son requeridos"
                });
            }
            const result = await passwordReset_service_1.PasswordResetService.resetPassword(token, newPassword);
            res.json(result);
        }
        catch (error) {
            const status = error.status || 500;
            const message = error.message || "Error interno del servidor";
            res.status(status).json({ message });
        }
    },
};
