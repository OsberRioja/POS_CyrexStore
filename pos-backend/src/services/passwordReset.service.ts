import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PasswordResetTokenRepository } from "../repositories/passwordResetToken.repository";
import { UserRepository } from "../repositories/user.repository";
import { emailService } from "./email.service";
import { env } from "../env";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 1; // 1 hora de expiración

export const PasswordResetService = {
  async requestPasswordReset(email: string) {
    // Verificar que el usuario existe
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Por seguridad, no revelamos que el email no existe
      return;
    }

    // Generar token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Guardar token en la base de datos
    await PasswordResetTokenRepository.create(token, user.id, expiresAt);

    // Generar enlace de reset
    const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;

    return {
      user,
      resetLink,
      token
    };
  },

  async validateResetToken(token: string) {
    const isValid = await PasswordResetTokenRepository.isValidToken(token);
    if (!isValid) {
      throw { status: 400, message: "Token inválido o expirado" };
    }
    return true;
  },

  async resetPassword(token: string, newPassword: string) {
    // Validar token
    const resetToken = await PasswordResetTokenRepository.findByToken(token);
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
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizar contraseña del usuario
    await UserRepository.updateUser(resetToken.userId, {
      password: passwordHash,
    });

    // Marcar token como usado
    await PasswordResetTokenRepository.markAsUsed(token);

    return { 
      message: "Contraseña restablecida exitosamente",
      user: resetToken.user
    };
  },

  async cleanupExpiredTokens() {
    return PasswordResetTokenRepository.deleteExpiredTokens();
  },
};