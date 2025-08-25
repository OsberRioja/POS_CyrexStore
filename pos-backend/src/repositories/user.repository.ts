import { prisma } from "../prismaClient";
import { CreateUserDTO } from "../dtos/createUser.dto";
import { User } from "@prisma/client";

export const UserRepository = {
  async create(data: {
    usercode: number;
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    role: "ADMIN" | "SUPERVISOR" | "SELLER";
  }) {
    return prisma.user.create({
      data: {
        userCode: data.usercode,
        name: data.name,
        email: data.email,
        password: data.passwordHash,
        phone: data.phone ?? null,
        role: data.role,
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

  // async findByQuery(q?: string) {
  //  if (!q || !q.trim()) return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
 
  //  const text = q.trim();
  //  const numeric = /^\d+$/.test(text) ? Number(text) : null;
 
  //  const or: any[] = [];
  //  if (numeric !== null) or.push({ usercode: numeric });
  //  or.push({ name: { contains: text, mode: "insensitive" } });
  //  or.push({ email: { contains: text, mode: "insensitive" } });
  //  or.push({ phone: { contains: text, mode: "insensitive" } });
 
  //  return prisma.user.findMany({
  //    where: { OR: or },
  //    orderBy: { createdAt: "desc" },
  //  });
  // } 
};