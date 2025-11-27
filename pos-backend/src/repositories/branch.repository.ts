import { PrismaClient, Branch } from '@prisma/client';

const prisma = new PrismaClient();

export class BranchRepository {
  async findAll(): Promise<Branch[]> {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: number): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { id, isActive: true }
    });
  }

  async create(data: { name: string; address?: string; phone?: string }): Promise<Branch> {
    return prisma.branch.create({
      data: {
        ...data,
        isActive: true
      }
    });
  }

  async update(id: number, data: { name?: string; address?: string; phone?: string; isActive?: boolean }): Promise<Branch> {
    return prisma.branch.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<Branch> {
    return prisma.branch.update({
      where: { id },
      data: { isActive: false }
    });
  }
}