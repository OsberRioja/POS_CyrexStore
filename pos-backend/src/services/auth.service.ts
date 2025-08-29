import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//import { StringValue } from "ms";
import { env } from "../env";
import { UserRepository } from "../repositories/user.repository";
//import type { User } from "@prisma/client";
//import { generateUniqueUsercode } from "../utils/userCode";

export function generarToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export const AuthService = {
  // NO necesitas register aquí - ya tienes UserService.createUser() funcionando

  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw { status: 401, message: "Credenciales inválidas" };

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw { status: 401, message: "Credenciales inválidas" };

    // construir payload y firmar token
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      userCode: user.userCode, // Añadido para tener el código disponible
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    // devolver token + user (sin password)
    const { password: _p, ...userSafe } = (user as any);
    return { token, user: userSafe };
  },

  verifyToken(token: string) {
    return jwt.verify(token, env.JWT_SECRET);
  },
};