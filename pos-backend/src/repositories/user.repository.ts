import { prisma } from "../prismaClient";
import { CreateUserDTO } from "../dtos/createUser.dto";
import { User } from "@prisma/client";

export const UserRepository = {
  async create(dto: CreateUserDTO & { passwordChangeRequired?: boolean; branchId?: number | null }): Promise<User> {
    return prisma.user.create({
      data: {
        userCode: dto.userCode,
        name: dto.name,
        email: dto.email,
        password: dto.password ?? "",
        phone: dto.phone ?? null,
        role: dto.role,
        passwordChangeRequired: dto.passwordChangeRequired ?? false,
        branchId: dto.branchId, // ← NUEVO: incluir branchId
      },
    });
  },

  async findAll(branchId?: number | null) {
    // Filtrar por sucursal si se proporciona
    const where: any = { deleted: false };
    if (branchId !== undefined && branchId !== null) {
      where.branchId = branchId;
    }

    return prisma.user.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
        deleted: false
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
  },

  async findByUsercode(userCode: number) {
    return prisma.user.findUnique({ 
      where: { userCode, deleted: false },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ 
      where: { id, deleted: false },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
  },

  async findByName(name: string) {
    return prisma.user.findMany({ 
      where: { name, deleted: false },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
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
      branchId?: number | null;
    }
  ): Promise<User | null> {
    // Solo actualizar si el usuario existe
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.password && { password: data.password }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.role && { role: data.role }),
        ...(data.passwordChangeRequired !== undefined && {
          passwordChangeRequired: data.passwordChangeRequired
        }),
        ...(data.branchId !== undefined && { branchId: data.branchId }), // ← NUEVO: actualizar branchId
      },
    });

    return updatedUser;
  },

  async deleteUser(id: string) {
    // Verificar si existe
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return null;
    // Soft delete: marcar como eliminado en lugar de borrar
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        deleted: true,
        email: `deleted_${Date.now()}_${existingUser.email}`, // Evitar conflictos de email único
        userCode: -Math.abs(existingUser.userCode ?? 0) // Evitar conflictos de userCode único
      },
    });
    return updatedUser;
  },

  async getByRole(role: "ADMIN" | "SUPERVISOR" | "SELLER") {
    return prisma.user.findMany({ 
      where: { role },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
  }
};