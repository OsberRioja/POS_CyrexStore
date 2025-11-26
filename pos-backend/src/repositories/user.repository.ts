import { prisma } from "../prismaClient";
import { CreateUserDTO } from "../dtos/createUser.dto";
import { User } from "@prisma/client";

export const UserRepository = {
  async create(dto: CreateUserDTO & { passwordChangeRequired?: boolean}): Promise<User> {
    return prisma.user.create({
      data: {
        userCode: dto.userCode,
        name: dto.name,
        email: dto.email,
        password: dto.password ?? "",
        phone: dto.phone ?? null,
        role: dto.role,
        passwordChangeRequired: dto.passwordChangeRequired ?? false,
      },
    });
  },
  async findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByUsercode(userCode: number) {
    return prisma.user.findUnique({ where: { userCode } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByName(name: string) {
    return prisma.user.findMany({ where: { name } });
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
      },
    });

    return updatedUser;
  },

  async deleteUser(id: string) {
    // Verificar si existe
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return null;

    // Eliminar usuario
    const deletedUser = await prisma.user.delete({
      where: { id },
    });

    return deletedUser;
 },
 async getByRole(role: "ADMIN" | "SUPERVISOR" | "SELLER") {
    return prisma.user.findMany({ where: { role } });
  }
};