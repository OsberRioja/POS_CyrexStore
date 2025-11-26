import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository";

const SALT_ROUNDS = 10;

export const PasswordService = {
  async changePassword(userId: string, newPassword: string) {
    // Validar fortaleza de contraseña
    if (newPassword.length < 8) {
      throw { status: 400, message: "La contraseña debe tener al menos 8 caracteres" };
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizar usuario
    const updatedUser = await UserRepository.updateUser(userId, {
      password: passwordHash,
      passwordChangeRequired: false, // Marcar que ya no requiere cambio
    });

    if (!updatedUser) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    return { user: updatedUser };
  },

  async validateCurrentPassword(userId: string, currentPassword: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      throw { status: 401, message: "La contraseña actual es incorrecta" };
    }

    return true;
  },
};