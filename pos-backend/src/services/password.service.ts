import bcrypt from 'bcryptjs';
import { validatePasswordStrength } from '../utils/passwordGenerator';
import { UserRepository } from '../repositories/user.repository';

export const PasswordService = {
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar usuario
      const user = await UserRepository.findById(userId);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Contraseña actual incorrecta' };
      }

      // Validar fortaleza de la nueva contraseña
      const validation = validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(', ') };
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y quitar el flag de cambio requerido
      await UserRepository.updateUser(userId, {
        password: hashedNewPassword,
        passwordChangeRequired: false,
      });

      return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      console.error('Error en changePassword:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  },

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validar fortaleza de la nueva contraseña
      const validation = validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(', ') };
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await UserRepository.updateUser(userId, {
        password: hashedNewPassword,
        passwordChangeRequired: false,
      });

      return { success: true, message: 'Contraseña restablecida correctamente' };
    } catch (error) {
      console.error('Error en resetPassword:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  },
};