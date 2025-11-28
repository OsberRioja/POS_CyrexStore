import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import type { CreateUserDTO, RoleString } from "../dtos/createUser.dto";
import { generateUniqueUsercode } from "../utils/userCode";
import { User } from "@prisma/client";
import { generateTemporaryPassword } from "../utils/passwordGenerator";
import { emailService } from "./email.service";
import { env } from "../env";

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

// Validar formato de email (básico)
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const UserService = {
  async createUser(dto: CreateUserDTO, currentUserBranchId?: number | null) {
    if (!dto.name || !dto.email || !dto.role || !dto.phone) {
      throw { status: 400, message: "todos los campos son requeridos" };
    }

    if (!isValidEmail(dto.email)) {
      throw { status: 400, message: "formato de email inválido" };
    }

    // Verificar si el email ya existe
    const existingEmail = await UserRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw { status: 409, message: "El email ya está registrado" };
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    const role = mapRole(dto.role);

    // Determinar branchId para el nuevo usuario
    let userBranchId: number | null = null;

    // Si el usuario actual es administrador global (currentUserBranchId es null) y proporciona un branchId, usarlo
    if (currentUserBranchId === null && dto.branchId) {
      userBranchId = dto.branchId;
    }
    // Si el usuario actual tiene una sucursal (currentUserBranchId es un número), asignar esa sucursal
    else if (currentUserBranchId) {
      userBranchId = currentUserBranchId;
    }
    // Si el rol es ADMIN, puede ser global (branchId null)
    else if (role === 'ADMIN') {
      userBranchId = null;
    }
    // Para otros roles, debe tener sucursal. Si no se puede determinar, lanzar error.
    else {
      throw { status: 400, message: "No se puede determinar la sucursal para el usuario" };
    }

    // 1) Si el cliente envió usercode, parsear y validar.
    let providedUsercode: number | undefined;
    try {
      providedUsercode = parseAndValidateUsercode(dto.userCode);
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
          userCode: usercode,
          name: dto.name,
          email: dto.email,
          password: passwordHash,   // enviar la contraseña ya hasheada
          phone: dto.phone ?? null,
          role: role as "ADMIN" | "SUPERVISOR" | "SELLER",
          passwordChangeRequired: true,
          branchId: userBranchId ?? undefined,
        });

        // Enviar email de invitación
        try {
          const invitationData = {
            userName: user.name,
            userEmail: user.email,
            temporaryPassword: temporaryPassword,
            loginUrl: env.frontendUrl,
            companyName: env.email.fromName || 'CYREX STORE',
            adminName: 'Administrador del Sistema',
          };
          const emailSent = await emailService.sendInvitationEmail(invitationData);
          if (emailSent) {
            console.log(`📧 Email de invitación enviado a: ${user.email}`);
          } else {
            console.warn(`⚠️ No se pudo enviar el email de invitación a: ${user.email}`);
          }
        } catch (emailErr) {
          console.error(`❌ Error al enviar email de invitación a ${user.email}:`, emailErr);
        }

        // limpiar password antes de devolver
        const { password, ...safeUser } = user as any;
        return {
          ...safeUser,
          emailSent: true,
        };
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

  async listUsers(currentUserBranchId?: number | null) {
    // ← NUEVO: Pasar branchId para filtrar
    return UserRepository.findAll(currentUserBranchId);
  },

  async getUserById(id: string) {
    const u = await UserRepository.findById(id);
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
      passwordChangeRequired?: boolean;
      branchId?: number | null; // ← NUEVO: permitir actualizar branchId
    }
  ): Promise<User | null> {
    // comprobar existencia
    const existing = await UserRepository.findById(id);
    if (!existing) throw { status: 404, message: "Usuario no encontrado" };

    const updatedData: any = { ...data };
    if (data.password) {
      updatedData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const user = await UserRepository.updateUser(id, updatedData);
    if (!user) throw { status: 404, message: "Usuario no encontrado"};
    return user;
  },

  async deleteUser(id: string): Promise<User> {
    const user = await UserRepository.deleteUser(id);
    if (!user) throw { status: 404, message: "Usuario no encontrado" };
    return user;
  },
};