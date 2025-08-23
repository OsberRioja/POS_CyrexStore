// src/services/user.service.ts
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";
import { UserRepository } from "../repositories/user.repository";
import type { CreateUserDTO, RoleString } from "../dtos/createUser.dto";

const SALT_ROUNDS = 10;
const CREATE_RETRY = 5; // reintentos si hay colisiones por race

/** Genera un candidato aleatorio de 4 dígitos (1000 - 9999) */
function generateCandidateUsercode(): number {
  return Math.floor(1000 + Math.random() * 9000);
}

/**
 * Genera un usercode probable no colisionante.
 * Intenta candidatos aleatorios hasta maxAttempts, si falla usa el mayor usercode+1 como fallback.
 */
export async function generateUniqueUsercode(maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateCandidateUsercode();
    const exists = await prisma.user.findUnique({ where: { userCode: candidate } });
    if (!exists) return candidate;
  }

  // fallback: obtener el mayor usercode no-null
  const highest = await prisma.user.findMany({
    where: { userCode: { not: null } },
    orderBy: { userCode: "desc" },
    take: 1,
    select: { userCode: true },
  });

  let next: number;
  if (highest.length > 0 && highest[0].userCode != null) {
    next = highest[0].userCode + 1;
  } else {
    next = 1000;
  }

  if (next > 9999) next = 1000;

  // verificar que no exista; si existe el caller reintentará o se manejará P2002
  const existsFinal = await prisma.user.findUnique({ where: { userCode: next } });
  if (!existsFinal) return next;

  // último recurso: linear scan (muy improbable)
  for (let i = 0; i < 9000; i++) {
    next++;
    if (next > 9999) next = 1000;
    const e = await prisma.user.findUnique({ where: { userCode: next } });
    if (!e) return next;
  }

  throw new Error("No se pudo generar un usercode único");
}

/** Mapear role string a enum de Prisma (mayúsculas) */
function mapRole(role?: RoleString): "ADMIN" | "SUPERVISOR" | "SELLER" {
  if (!role) return "SELLER";
  switch (role.toLowerCase()) {
    case "admin":
      return "ADMIN";
    case "supervisor":
      return "SUPERVISOR";
    case "seller":
    default:
      return "SELLER";
  }
}

export const UserService = {
  /**
   * Crea un usuario. Si dto.usercode no viene, lo genera.
   * Reintenta CREATE_RETRY veces si hay colisiones por usercode (P2002) y vuelve a generar.
   */
  async createUser(dto: CreateUserDTO) {
    if (!dto.userName || !dto.email || !dto.password || !dto.role || !dto.phone) {
      throw { status: 400, message: "username, email y password son requeridos" };
    }

    // Mapear rol y hashear contraseña
    const role = mapRole(dto.role);
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Si no viene usercode lo generamos
    let usercode = dto.userCode;
    if (!usercode) {
      usercode = await generateUniqueUsercode(10);
    }

    // Intentar crear, reintentando si chocamos por unique constraint (P2002)
    for (let attempt = 0; attempt < CREATE_RETRY; attempt++) {
      try {
        const user = await UserRepository.create({
          usercode,
          username: dto.userName,
          email: dto.email,
          passwordHash,
          phone: dto.phone ?? null,
          role: role as "ADMIN" | "SUPERVISOR" | "SELLER",
        });

        // No devolver password al cliente
        const { password, ...safeUser } = user as any;
        return safeUser;
      } catch (err: unknown) {
        // Solo manejamos Prisma P2002 explícitamente
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // err.meta.target puede ser string | string[] | undefined
          const rawTarget: unknown = (err as any).meta?.target ?? (err as any).meta?.field_name;
          // Opción 1 (explicita): detectar tipo y comprobar includes correctamente
          if (Array.isArray(rawTarget)) {
            // ejemplo: ["usercode"]
            if (rawTarget.includes("usercode")) {
              // generar otro usercode y reintentar
              usercode = await generateUniqueUsercode(10);
              continue; // siguiente intento
            } else if (rawTarget.includes("email")) {
              throw { status: 409, message: "Email ya registrado" };
            } else {
              throw { status: 409, message: "Violación de unicidad (campo múltiple)" };
            }
          } else if (typeof rawTarget === "string") {
            // ejemplo: "usercode" o "email"
            if (rawTarget.includes("usercode")) {
              usercode = await generateUniqueUsercode(10);
              continue;// siguiente intento
            } else if (rawTarget.includes("email")) {
              throw { status: 409, message: "Email ya registrado" };
            } else {
              throw { status: 409, message: "Violación de unicidad (campo múltiple)" };
            }
          } else if (typeof rawTarget === "string") {
            // ejemplo: "usercode" o "email"
            if (rawTarget.includes("usercode")) {
              usercode = await generateUniqueUsercode(10);
              continue;
            } else if (rawTarget.includes("email")) {
              throw { status: 409, message: "Email ya registrado" };
            } else {
              throw { status: 409, message: "Violación de unicidad (campo desconocido)" };
            }
          } else {
            // fallback genérico: la violación es por algún campo único; reportar conflicto
            throw { status: 409, message: "Email o usercode ya registrados" };
          }
        }

        // Si no es P2002 o no sabemos manejarlo, propagar
        console.error("Error al crear usuario:", err);
        throw { status: 500, message: "Error interno al crear usuario" };
      }
    }

    // Si salimos del bucle sin crear el usuario
    throw { status: 500, message: "No se pudo generar un usercode único. Intenta nuevamente" };
  },

  // Otros métodos (ej: validateCredentials) pueden ir aquí...
};
