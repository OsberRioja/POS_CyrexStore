import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import type { CreateUserDTO, RoleString } from "../dtos/createUser.dto";
import { generateUniqueUsercode } from "../utils/userCode";
import { User } from "@prisma/client";

const SALT_ROUNDS = 10;
const CREATE_RETRY = 5;

/** Helper: validar y parsear usercode recibido */
function parseAndValidateUsercode(input?: number | string): number | undefined {
  if (input === undefined || input === null) return undefined;
  const n = typeof input === "string" ? Number(input) : input;
  if (!Number.isInteger(n) || n < 1000 || n > 9999) {
    throw { status: 400, message: "usercode debe ser un número entero de 4 dígitos (1000-9999)" };
  }
  return n;
}

function mapRole(role?: RoleString): "ADMIN" | "SUPERVISOR" | "SELLER" {
  if (!role) return "SELLER";
  switch (role.toLowerCase()) {
    case "admin": return "ADMIN";
    case "supervisor": return "SUPERVISOR";
    default: return "SELLER";
  }
}

export const UserService = {
  async createUser(dto: CreateUserDTO) {
    if (!dto.name || !dto.email || !dto.password || !dto.role || !dto.phone) {
      throw { status: 400, message: "todos los son requeridos" };
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const role = mapRole(dto.role);

    // 1) Si el cliente envió usercode, parsear y validar.
    let providedUsercode: number | undefined;
    try {
      providedUsercode = parseAndValidateUsercode((dto as any).userCode);
    } catch (e) {
      throw e;
    }

    // 2) Si vino usercode, comprobar que no exista ya
    if (providedUsercode !== undefined) {
      const exists = await UserRepository.findByUsercode(providedUsercode);
      if (exists) {
        throw { status: 409, message: `usercode ${providedUsercode} ya está en uso` };
      }
    }

    // 3) Si no vino usercode, generamos uno (y nos preparamos para reintentar si colisiona)
    let usercode = providedUsercode;
    if (usercode === undefined) {
      usercode = await generateUniqueUsercode();
    }

    // 4) Intentar crear (si fue provisto por el cliente y colisiona, devolvemos 409;
    //    si fue generado por nosotros, reintentamos en caso de P2002 por usercode).
    for (let attempt = 0; attempt < CREATE_RETRY; attempt++) {
      try {
        const user = await UserRepository.create({
          usercode,
          name: dto.name,
          email: dto.email,
          passwordHash,
          phone: dto.phone ?? null,
          role: role as "ADMIN" | "SUPERVISOR" | "SELLER",
        });

        // limpiar password antes de devolver
        const { password, ...safeUser } = user as any;
        return safeUser;
      } catch (err: unknown) {
        // Solo manejamos Prisma P2002 (unique constraint)
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          const rawTarget: unknown = (err as any).meta?.target ?? (err as any).meta?.field_name;

          // Normalizar target a string
          const targetStr = Array.isArray(rawTarget) ? rawTarget.join(",") : String(rawTarget ?? "");

          // Si la colisión es en usercode:
          if (targetStr.includes("usercode")) {
            // Si el usercode fue PROVEÍDO por el cliente, no lo reemplazamos: error 409
            if (providedUsercode !== undefined) {
              throw { status: 409, message: `usercode ${providedUsercode} ya registrado` };
            }
            // Si fue generado por nosotros, generamos otro y reintentamos
            usercode = await generateUniqueUsercode();
            continue;
          }

          // Si la colisión fue por email u otro campo único -> 409
          if (targetStr.includes("email")) {
            throw { status: 409, message: "Email ya registrado" };
          }

          // caso genérico: conflict
          throw { status: 409, message: "Violación de unicidad (campo) " + targetStr };
        }

        // otro error: propagar como 500
        console.error("Error creacion usuario:", err);
        throw { status: 500, message: "Error interno al crear usuario" };
      }
    }

    // Si no conseguimos crear tras reintentos
    throw { status: 500, message: "No se pudo generar un usercode único. Intenta de nuevo." };
  },

  async listUsers(){
    return UserRepository.findAll();
  },

  async getUserById(id: string) {
    const u = await UserRepository.findById(id  );
    if (!u) throw { status: 404, message: "Usuario no encontrado"};
    return u;
  },

  async getByUserCode(usercode: number) {
    const u = await UserRepository.findByUsercode(usercode);
    if (!u) throw { status: 404, message: "Codigo de Usuario no encontrado"};
    return u;
  },

  async getByEmail(email: string) {
    const u = await UserRepository.findByEmail(email);
    if (!u) throw { status: 404, message: "Email no encontrado"};
    return u;
  },

  async getByName(name: string) {
    const u = await UserRepository.findByName(name);
    if (!u) throw { status: 404, message: "Nombre no encontrado"};
    return u;
  },

  async updateUser(
    id: string,
    data: {
      name?: string;
      password?: string;
      email?: string;
      phone?: string;
      role?: "ADMIN" | "SUPERVISOR" | "SELLER";
    }
    ): Promise<User | null> {
        const user = await UserRepository.updateUser(id, data);
        if (!user) throw { status: 404, message: "Usuario no encontrado"};
        return user;
    },

    async deleteUser(id: string): Promise<User> {
        const user = await UserRepository.deleteUser(id);
        if (!user) throw { status: 404, message: "Usuario no encontrado" };
        return user;
    }

};
