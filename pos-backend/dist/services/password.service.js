"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_repository_1 = require("../repositories/user.repository");
const SALT_ROUNDS = 10;
exports.PasswordService = {
    async changePassword(userId, newPassword) {
        // Validar fortaleza de contraseña
        if (newPassword.length < 8) {
            throw { status: 400, message: "La contraseña debe tener al menos 8 caracteres" };
        }
        // Hashear nueva contraseña
        const passwordHash = await bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
        // Actualizar usuario
        const updatedUser = await user_repository_1.UserRepository.updateUser(userId, {
            password: passwordHash,
            passwordChangeRequired: false, // Marcar que ya no requiere cambio
        });
        if (!updatedUser) {
            throw { status: 404, message: "Usuario no encontrado" };
        }
        return { user: updatedUser };
    },
    async validateCurrentPassword(userId, currentPassword) {
        const user = await user_repository_1.UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "Usuario no encontrado" };
        }
        const match = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!match) {
            throw { status: 401, message: "La contraseña actual es incorrecta" };
        }
        return true;
    },
};
