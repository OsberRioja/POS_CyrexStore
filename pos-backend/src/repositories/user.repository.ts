import { prisma } from "../prismaClient";
import { CreateUserDTO } from "../dtos/createUser.dto";

export const UserRepository = {
  async create(data: {
    usercode: number;
    username: string;
    email: string;
    passwordHash: string;
    phone: string;
    role: "ADMIN" | "SUPERVISOR" | "SELLER";
  }) {
    return prisma.user.create({
      data: {
        userCode: data.usercode,
        name: data.username,
        email: data.email,
        password: data.passwordHash,
        phone: data.phone ?? null,
        role: data.role,
      },
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
  }
};