"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetService = void 0;
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const passwordResetToken_repository_1 = require("../repositories/passwordResetToken.repository");
const user_repository_1 = require("../repositories/user.repository");
const env_1 = require("../env");
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 1; // 1 hora de expiración
exports.PasswordResetService = {
    async requestPasswordReset(email) {
        // Verificar que el usuario existe
        const user = await user_repository_1.UserRepository.findByEmail(email);
        if (!user) {
            // Por seguridad, no revelamos que el email no existe
            return;
        }
        // Generar token único
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        // Guardar token en la base de datos
        await passwordResetToken_repository_1.PasswordResetTokenRepository.create(token, user.id, expiresAt);
        // Generar enlace de reset
        const resetLink = `${env_1.env.frontendUrl}/reset-password?token=${token}`;
        return {
            user,
            resetLink,
            token
        };
    },
    async validateResetToken(token) {
        const isValid = await passwordResetToken_repository_1.PasswordResetTokenRepository.isValidToken(token);
        if (!isValid) {
            throw { status: 400, message: "Token inválido o expirado" };
        }
        return true;
    },
    async resetPassword(token, newPassword) {
        // Validar token
        const resetToken = await passwordResetToken_repository_1.PasswordResetTokenRepository.findByToken(token);
        if (!resetToken) {
            throw { status: 400, message: "Token inválido" };
        }
        if (resetToken.used) {
            throw { status: 400, message: "Este token ya ha sido utilizado" };
        }
        if (resetToken.expiresAt < new Date()) {
            throw { status: 400, message: "Token expirado" };
        }
        // Validar fortaleza de contraseña
        if (newPassword.length < 8) {
            throw { status: 400, message: "La contraseña debe tener al menos 8 caracteres" };
        }
        // Hashear nueva contraseña
        const passwordHash = await bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
        // Actualizar contraseña del usuario
        await user_repository_1.UserRepository.updateUser(resetToken.userId, {
            password: passwordHash,
        });
        // Marcar token como usado
        await passwordResetToken_repository_1.PasswordResetTokenRepository.markAsUsed(token);
        return {
            message: "Contraseña restablecida exitosamente",
            user: resetToken.user
        };
    },
    async cleanupExpiredTokens() {
        return passwordResetToken_repository_1.PasswordResetTokenRepository.deleteExpiredTokens();
    },
};
