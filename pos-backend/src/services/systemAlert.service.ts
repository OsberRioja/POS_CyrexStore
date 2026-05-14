import { Prisma } from "@prisma/client";
import { SystemAlertRepository } from "../repositories/systemAlert.repository";

export const SYSTEM_ALERT_TYPES = {
  CASHBOX_REOPENED: "CASHBOX_REOPENED",
} as const;

export interface ListSystemAlertsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  branchId?: number;
}

export const SystemAlertService = {
  async list(params: ListSystemAlertsParams) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 10), 100);
    const filters = {
      unreadOnly: params.unreadOnly,
      type: params.type,
      branchId: params.branchId,
    };

    const [data, total] = await Promise.all([
      SystemAlertRepository.findMany({ page, limit, ...filters }),
      SystemAlertRepository.count(filters),
    ]);

    return { data, total, page, limit };
  },

  async createCashboxReopenedAlert(params: {
    cashBoxId: number;
    branchId: number;
    branchName: string;
    actorUserId: string;
    actorUserName: string;
    reopenedAt: Date;
  }) {
    const reopenedAtText = new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(params.reopenedAt);

    return SystemAlertRepository.create({
      type: SYSTEM_ALERT_TYPES.CASHBOX_REOPENED,
      title: "Caja reabierta",
      message: `El usuario ${params.actorUserName} reabrió la caja #${params.cashBoxId} de la sucursal ${params.branchName} el ${reopenedAtText}`,
      referenceId: params.cashBoxId,
      createdAt: params.reopenedAt,
      user: { connect: { id: params.actorUserId } },
      branch: { connect: { id: params.branchId } },
    });
  },

  async markAsRead(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw { status: 400, message: "ID de alerta inválido" };
    }

    try {
      return await SystemAlertRepository.markAsRead(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw { status: 404, message: "Alerta no encontrada" };
      }
      throw error;
    }
  },

  async delete(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw { status: 400, message: "ID de alerta inválido" };
    }

    try {
      return await SystemAlertRepository.delete(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw { status: 404, message: "Alerta no encontrada" };
      }
      throw error;
    }
  },
};
