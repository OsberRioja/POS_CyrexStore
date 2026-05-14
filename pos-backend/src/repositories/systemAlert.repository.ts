import { Prisma, SystemAlert } from "@prisma/client";
import { prisma } from "../prismaClient";

export interface ListSystemAlertsOptions {
  page: number;
  limit: number;
  unreadOnly?: boolean;
  type?: string;
  branchId?: number;
}

const systemAlertInclude = {
  user: {
    select: {
      id: true,
      name: true,
      userCode: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.SystemAlertInclude;

export type SystemAlertWithRelations = Prisma.SystemAlertGetPayload<{
  include: typeof systemAlertInclude;
}>;

export const SystemAlertRepository = {
  async create(data: Prisma.SystemAlertCreateInput): Promise<SystemAlert> {
    return prisma.systemAlert.create({ data });
  },

  async findMany(options: ListSystemAlertsOptions): Promise<SystemAlertWithRelations[]> {
    const where: Prisma.SystemAlertWhereInput = {
      ...(options.unreadOnly ? { isRead: false } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.branchId ? { branchId: options.branchId } : {}),
    };

    return prisma.systemAlert.findMany({
      where,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      orderBy: { createdAt: "desc" },
      include: systemAlertInclude,
    });
  },

  async count(options: Omit<ListSystemAlertsOptions, "page" | "limit">): Promise<number> {
    const where: Prisma.SystemAlertWhereInput = {
      ...(options.unreadOnly ? { isRead: false } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.branchId ? { branchId: options.branchId } : {}),
    };

    return prisma.systemAlert.count({ where });
  },

  async markAsRead(id: number): Promise<SystemAlertWithRelations> {
    return prisma.systemAlert.update({
      where: { id },
      data: { isRead: true },
      include: systemAlertInclude,
    });
  },

  async delete(id: number): Promise<SystemAlert> {
    return prisma.systemAlert.delete({ where: { id } });
  },
};
