import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { UserRepository } from "../repositories/user.repository";
import { id } from "zod/v4/locales/index.cjs";

export function generarToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export const AuthService = {

  async login(login: string, password: string) {
    let user = null;

    // determinar si login es email o usercode
    if (/^\d+$/.test(login)) {
      // Es un código de usuario (solo números)
      const userCode = parseInt(login, 10);
      user = await UserRepository.findByUsercode(userCode);
    } else {
      // Es un email
      user = await UserRepository.findByEmail(login);
    }

    if (!user) throw { status: 401, message: "Credenciales inválidas" };

    const match = await bcrypt.compare(password, user.password);
    console.log("login attempt for:", login);
    console.log("stored password:", user.password);

    if (!match) throw { status: 401, message: "Credenciales inválidas" };

    // construir payload y firmar token
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      userCode: user.userCode, // Añadido para tener el código disponible
      branchId: user.branchId,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    // devolver token + user (sin password) + informacion de cambio de contraseña
    const { password: _p, ...userSafe } = (user as any);

    // Informacion de sucursal en la respuesta
    let branchInfo = null;
    if (user.branchId) {
      // SI es necesario cargar info de sucursal, hacerlo aqui
      branchInfo = {
        id: user.branchId,
        // podemos agregar mas info si es necesario
      };
    }

    return {
      token,
      user: {
        ...userSafe,
        branchId: user.branchId,
      },
      requiresPasswordChange: user.passwordChangeRequired,
      branch: branchInfo
    };
  },

  verifyToken(token: string) {
    return jwt.verify(token, env.JWT_SECRET);
  },
};